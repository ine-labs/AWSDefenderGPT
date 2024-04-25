import json
import platform
import subprocess
import threading
import time

import boto3
import requests
from openai import OpenAI

from app import app, db_operations
from app.socket_manager import socketio

from .aws_resources import resources

db_operations.create_table()


def data_emitter(data, id):
    emit_data = {"data": str(data), "id": str(id)}
    app.logger.info("Emitting data: " + str(emit_data))
    socketio.emit("logs", emit_data, broadcast=True)


def aws_cli_tool(command):
    try:
        # check if the command is start with aws
        if not command.startswith("aws"):
            command = "aws " + command

        execution_id = db_operations.store_execution(command)
        thread = threading.Thread(target=data_emitter, args=(command, execution_id))
        thread.start()

        start_time = time.time()
        settings = db_operations.get_settings()
        monitor = settings["monitor_mode"]
        app.logger.info("Monitor mode: " + str(monitor))
        # Store the command in the execution queue and get the ID

        # Wait until the command is accepted
        while monitor:
            execution_details = db_operations.get_execution_by_id(execution_id)
            app.logger.info("Execution details: " + str(execution_details))
            app.logger.info("Waiting ...")
            if execution_details and execution_details["status"] == "accepted":
                app.logger.info("Command execution accepted.")
                break
            if execution_details and execution_details["status"] == "rejected":
                app.logger.info("Command execution rejected.")
                return json.dumps(
                    {"output": None, "error": "Command execution rejected."}
                )

            time.sleep(1)
            if time.time() - start_time > 260:
                app.logger.info("Command execution timeout.")
                return json.dumps(
                    {"output": None, "error": "Command execution timeout."}
                )

        # AWS Configuration
        aws_credentials = db_operations.get_aws_credentials()
        aws_access_key_id = aws_credentials[0] if aws_credentials else None
        aws_secret_access_key = aws_credentials[1] if aws_credentials else None
        aws_session_token = ""
        aws_region = aws_credentials[2] if aws_credentials else None
        os_name = platform.system()

        if os_name == "Windows":
            result = subprocess.run(command, shell=True, capture_output=True, text=True)
        elif os_name == "Linux":
            credentials_prefix = (
                f"AWS_ACCESS_KEY_ID={aws_access_key_id} "
                f"AWS_SECRET_ACCESS_KEY={aws_secret_access_key} "
                f"AWS_SESSION_TOKEN={aws_session_token} "
                f"AWS_DEFAULT_REGION={aws_region} "
            )
            result = subprocess.run(
                credentials_prefix + command, shell=True, capture_output=True, text=True
            )
        else:
            result = subprocess.run(command, shell=True, capture_output=True, text=True)

        app.logger.info("Command execution results:")
        app.logger.info(str(result))

        print(result.stdout)

        if result.returncode == 0:
            return json.dumps({"output": result.stdout, "error": None})
        else:
            return json.dumps({"output": None, "error": result.stderr})

    except Exception as e:
        return json.dumps({"output": None, "error": str(e)})


def execute_scan(commands):
    results = []

    for i, command in enumerate(commands, start=1):
        result = aws_cli_tool(command)
        results.append({"command": command, "output": result})

        if "Error" in result:
            return json.dumps({"results": results, "error": result})

    return json.dumps({"results": results, "error": None})


# Functions dict to pass AWS operations details for the GPT model
functions = [
    {
        "name": "aws_cli_tool",
        "description": "executes aws cli commands and returns results",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The AWS CLI command to execute",
                },
            },
            "required": ["command"],
        },
    },
]

available_functions = {
    "aws_cli_tool": aws_cli_tool,
}


def chat_completion_request(messages, functions=None, function_call="auto"):
    tool_settings = db_operations.get_settings()
    model_name = tool_settings["openai_model"]
    open_ai_key = db_operations.get_openai_key()
    app.logger.info("OpenAI Key:" + str(open_ai_key))
    client = OpenAI(
        api_key=open_ai_key,
    )
    app.logger.info("Chat completion request started")
    app.logger.info("Messages: " + str(messages))
    app.logger.info("Functions: " + str(functions))
    app.logger.info("Function call: " + str(function_call))
    app.logger.info("Model name: " + str(model_name))
    if functions is not None:
        return client.chat.completions.create(
            model=model_name,
            messages=messages,
            functions=functions,
            function_call=function_call,
        )
    else:
        return client.chat.completions.create(model=model_name, messages=messages)


def run_conversation(
    user_input, ischat=False, topic="Amazon web services - AWS", is_log=False
):
    old_messages = db_operations.get_all_messages()

    system_message = f"Your focus area is {topic}. Remember, all AWS commands start with 'aws'. You have access to interact with the aws_cli_tool function for communicating with the AWS account. Avoid assumptions when inputting values into functions; seek clarification if user requests are ambiguous. If the user asks questions unrelated to {topic}, respond within the scope of {topic} only. Remember: All responses should be formatted in beautiful Markdown."
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_input},
    ]

    if old_messages:
        for message in old_messages:
            app.logger.info("Old message: " + str(message))
            org_message = {
                "role": "system",
                "content": system_message,
                "role": "user",
                "content": message["user_message"],
            }
            messages.append(org_message)
            ai_resp = ""
            if message["response_status"] != "pending":
                ai_resp = message["ai_response"]

            messages.append(
                {
                    "role": "function",
                    "name": "response",
                    "content": ai_resp,
                }
            )

    while True:
        # Call the model to get a response
        response = chat_completion_request(messages, functions=functions)

        if is_log:
            print(response["choices"])

        # Get the first choice's message
        response_message = response.choices[0].message

        app.logger.info("This first response output" + str(response_message))
        app.logger.info("function call" + str(response_message.function_call))

        # If there are no more function calls, break out of the loop
        if not response_message.function_call:
            final_message = response_message.content
            break

        function_name = response_message.function_call.name
        function_args = json.loads(response_message.function_call.arguments)

        # Call the function
        function_response = available_functions[function_name](**function_args)

        # Add the response to the conversation
        messages.append(response_message)
        messages.append(
            {
                "role": "function",
                "name": function_name,
                "content": function_response,
            }
        )

    return final_message


def process_input(user_message, message_id):
    app.logger.info("Received user message")
    response = run_conversation(user_message, ischat=True)
    db_operations.update_chat_service(message_id, response, "completed")
    socketio.emit(
        "chat:response",
        {
            "response": response,
            "message_id": message_id,
            "status": "completed",
            "replied": time.time(),
        },
        broadcast=True,
    )
    return response


# Function to create and return the list of async requests
def create_async_requests(service_list, regions):
    requests = []

    # AWS Configuration
    aws_credentials = db_operations.get_aws_credentials()
    aws_access_key_id = aws_credentials[0] if aws_credentials else None
    aws_secret_access_key = aws_credentials[1] if aws_credentials else None
    aws_session_token = ""
    aws_region = aws_credentials[2] if aws_credentials else None

    for region in regions:
        cloudcontrol_client = boto3.client(
            "cloudcontrol",
            region_name=region,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
        )
        for service in service_list:
            resource_list = resources.get(service)
            for resource in resource_list:
                req = scanner(cloudcontrol_client, resource, region)
                requests.append(req)
    return requests


async def scanner(client, resource_type, region):
    resources = []
    error_msg = ""
    print(resource_type)  # for some output check in terminal
    try:
        call_params = {"TypeName": resource_type}
        while True:
            cloudcontrol_response = client.list_resources(**call_params)
            for resource in cloudcontrol_response["ResourceDescriptions"]:
                resources.append(resource["Identifier"])
            try:
                call_params["NextToken"] = cloudcontrol_response["NextToken"]
            except KeyError:
                break

    except Exception as e:
        msg = str(e).lower()
        for keyword in ("denied", "authorization", "authorized"):
            if keyword in msg:
                error_msg = str(resource_type) + ": " + str(msg)
                break

    if len(resources) == 0 and len(error_msg) == 0:
        return None

    return {
        "resources": resources,
        "resources_type": resource_type,
        "error_msg": error_msg,
        "region": region,
    }


def scan_with_ai(service_list, regions, scan_id):
    system_message = f"""**Senior AWS Security Analyst, your mission is critical:**

    - **Deeply analyze these services:** {service_list} 
    - **Examine them across these regions:** {regions}
    - **Uncover ALL security misconfigurations or vulnerabilities, no matter how deeply hidden.**
    - **Employ multiple AWS CLI executions for meticulous analysis.**

    **Remember:**
    - Prioritize depth over speed. Missing a vulnerability is unacceptable.
    - Each service may require a unique scanning strategy. Adapt your approach.
    - Track your progress. Ensure you don't scan the same resource redundantly.
    - Consult AWS documentation alongside my suggestions.
      
    **Output Format**
    **Resource:** The affected AWS resource (e.g., S3, Lambda, EC2 ...).
    **Resource name:** The name of the affected AWS resource.
    **Resource arn:** The Amazon Resource Name (ARN) of the affected AWS resource.
    **Severity:** The severity of the issue (e.g., high, medium, low).
    **Message:** A brief summary of the issue in clear language.
    **Issue:** A detailed description of the security concern, providing context and potential implications.
    **Details:** Any additional relevant information, such as affected services, regions, or recommended mitigation actions.
    """

    messages = [
        {"role": "system", "content": system_message},
        {
            "role": "user",
            "content": "Begin a deep scan for misconfigurations and vulnerabilities across the specified services.",
        },
    ]

    app.logger.info(
        "Scan started for services: "
        + str(service_list)
        + " in regions: "
        + str(regions)
    )

    try:
        run_count = 0
        while run_count < 15:
            # Call the model to get a response
            response = chat_completion_request(messages, functions)
            response_message = response.choices[0].message

            app.logger.info("Response output:" + str(response_message))
            app.logger.info("Function call:" + str(response_message.function_call))

            # Check if GPT wanted to call a function
            if response_message.function_call:
                function_name = response_message.function_call.name
                function_args = json.loads(response_message.function_call.arguments)

                # Call the function
                function_response = available_functions[function_name](**function_args)

                # Add the response to the conversation
                messages.append(response_message)
                messages.append(
                    {
                        "role": "function",
                        "name": function_name,
                        "content": function_response,
                    }
                )

            else:
                result = scan_classification(response_message.content, scan_id)
                return result  # End if no function call

            run_count += 1  # Increment run count

        # Return a final message if the max run cap is reached
        app.logger.error("Maximum run count reached.")
        db_operations.update_scan_queue_status(scan_id, "failed")
        return "Maximum run count reached."

    except Exception as e:
        db_operations.update_scan_queue_status(scan_id, "failed")
        app.logger.error(f"An error occurred: {str(e)}")
        return "An error occurred while processing the scan request.", 500


def store_classification_results(scan_result, scan_id):
    """Stores multiple classification results in the database."""

    all_scan_results = []

    for result in scan_result:
        scan_result = {
            "resource": result["resource"],
            "resource_name": result["resource_name"],
            "resource_arn": result["resource_arn"],
            "severity": result["severity"],
            "message": result["message"],
            "issue": result["issue"],
            "details": result["details"],
            "fixed": False,
            "consent": False,
        }

        # Implementation for storing scan_result in the database
        db_operations.save_scan_details(**scan_result)
        app.logger.info("Stored classified result:" + str(scan_result))
        all_scan_results.append(scan_result)

    # update scan queue status with scan_id
    db_operations.update_scan_queue_status(scan_id, "completed")

    return all_scan_results


def scan_classification(content, scan_id):
    functions = [
        {
            "name": "store_classification_results",
            "description": "Store multiple classification results in the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "scan_result": {
                        "type": "array",
                        "description": "The scan result to store in the database",
                        "items": {
                            "type": "object",
                            "properties": {
                                "resource": {
                                    "type": "string",
                                    "description": "The affected AWS resource.",
                                },
                                "resource_name": {
                                    "type": "string",
                                    "description": "The name of the affected AWS resource.",
                                },
                                "resource_arn": {
                                    "type": "string",
                                    "description": "The Amazon Resource Name (ARN) of the affected AWS resource.",
                                },
                                "severity": {
                                    "type": "string",
                                    "description": "The severity of the issue (e.g., high, medium, low).",
                                },
                                "message": {
                                    "type": "string",
                                    "description": "A brief summary of the issue in clear language.",
                                },
                                "issue": {
                                    "type": "string",
                                    "description": "A detailed description of the security concern, providing context and potential implications.",
                                },
                                "details": {
                                    "type": "string",
                                    "description": "Any additional relevant information, such as affected services, regions, or recommended mitigation actions.",
                                },
                            },
                            "required": [
                                "resource",
                                "resource_name",
                                "resource_arn",
                                "severity",
                                "message",
                                "issue",
                                "details",
                            ],
                        },
                    }
                },
                "required": ["scan_result"],
            },
        }
    ]

    available_functions = {
        "store_classification_results": store_classification_results,
    }

    prompt = f"""**Analyze the following scan result and extract the essential information:**
    **Resource:** The affected AWS resource (e.g., S3, Lambda, EC2 ...).
    **Resource name:** The name of the affected AWS resource.
    **Resource arn:** The Amazon Resource Name (ARN) of the affected AWS resource.
    **Severity:** The severity of the issue (e.g., high, medium, low).
    **Message:** A brief summary of the issue in clear language.
    **Issue:** A detailed description of the security concern, providing context and potential implications.
    **Details:** Any additional relevant information, such as affected services, regions, or recommended mitigation actions.

    **Scan Result:**

    {content}

    **Prioritize accuracy and clarity in your response.**
    **Feel free to ask clarifying questions if needed.**
    Remember: If the scan result says No issues found, you should not classify it.
    """

    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": "classify the scan result",
        },
    ]

    response = chat_completion_request(messages, functions=functions)
    response_message = response.choices[0].message

    if response_message.function_call:
        function_name = response_message.function_call.name
        function_args = json.loads(response_message.function_call.arguments)
        # add scan_id to the function arguments
        function_args["scan_id"] = scan_id
        function_response = available_functions[function_name](**function_args)
        return function_response


def completion_updater(solution, fixed, scan_id):
    """Update the solution completion status in the database"""
    db_operations.update_scan_details(scan_id, fixed, None, solution)
    return "Scan result updated successfully."


def solution_generation(scan_result, patch_id):
    prompt = f"""In your capacity as a Senior Cloud Security Engineer, your responsibility is to address and resolve the identified issues. 
    To accomplish this, your task is to develop a comprehensive set of AWS CLI commands as solutions to rectify these issues. 
    Avoid placeholder samples and ensure that the provided commands form a coherent and sequential solution. 
    Utilize the AWS CLI tool to gather necessary information and execute step-by-step commands as a definitive solution.
    Finally, update the completion status of the scan result along with solution in the database.
    """
    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": f"Fix this issue in aws account using aws_cli_tool :{scan_result}",
        },
    ]

    solution_function = [
        {
            "name": "completion_updater",
            "description": "Update the solution completion status in the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "solution": {
                        "type": "string",
                        "description": "The solution to the identified issue",
                    },
                    "fixed": {
                        "type": "boolean",
                        "description": "The status of the issue after the solution is applied",
                    },
                    "scan_id": {
                        "type": "string",
                        "description": "The ID of the scan result",
                    },
                },
                "required": ["solution", "fixed", "scan_id"],
            },
        },
        {
            "name": "aws_cli_tool",
            "description": "executes aws cli commands and returns results",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The AWS CLI command to execute",
                    },
                },
                "required": ["command"],
            },
        },
    ]

    available_functions = {
        "completion_updater": completion_updater,
        "aws_cli_tool": aws_cli_tool,
    }

    run_count = 0
    while run_count < 30:
        # Call the model to get a response
        response = chat_completion_request(messages, functions=solution_function)
        response_message = response.choices[0].message

        app.logger.info("Response output:" + str(response_message))
        app.logger.info("Function call:" + str(response_message.function_call))

        # Check if GPT wanted to call a function
        if response_message.function_call:
            function_name = response_message.function_call.name
            function_args = json.loads(response_message.function_call.arguments)

            # Call the function
            function_response = available_functions[function_name](**function_args)

            # Add the response to the conversation
            messages.append(response_message)
            messages.append(
                {
                    "role": "function",
                    "name": function_name,
                    "content": function_response,
                }
            )

            # Continue the conversation
        else:
            db_operations.update_patch_queue_status(patch_id, "completed")
            return response_message.content  # End if no function call

        run_count += 1  # Increment run count

    # Return a final message if the max run cap is reached
    # update patch queue status with patch_id
    db_operations.update_patch_queue_status(patch_id, "failed")
    return "Maximum run count reached."


def patcher(scan_result, patch_id):
    """Patches the misconfigurations in the AWS account."""
    solution = solution_generation(scan_result, patch_id)
    return solution


# will use this later
def list_available_models():
    openai_api_key = db_operations.get_openai_key()
    headers = {"Authorization": f"Bearer {openai_api_key}"}
    response = requests.get("https://api.openai.com/v1/models", headers=headers)
    if response.status_code == 200:
        return response.json()["data"]
    else:
        print(f"Failed to list models: {response.text}")
        return None


# check you have access to the specific model
def check_model_access(model_name):
    openai_api_key = db_operations.get_openai_key()
    headers = {"Authorization": f"Bearer {openai_api_key}"}
    response = requests.get(
        f"https://api.openai.com/v1/models/{model_name}", headers=headers
    )
    if response.status_code == 200:
        print(response.json())
        app.logger.info(response.json())
        return True
    else:
        return False
