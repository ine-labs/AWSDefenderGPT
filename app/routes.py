import logging
import os
import threading

from flask import jsonify, request, send_from_directory
from flask_socketio import emit

from app import app, db_operations, processor
from app.socket_manager import socketio

logging.basicConfig(level=logging.INFO)

# serving react build
@app.route("/")
def serve_react_app():
    build_dir = os.path.join(os.getcwd(), "build")
    return send_from_directory(build_dir, "index.html")


@app.route("/static/css/<path:filename>")
def serve_css(filename):
    return send_from_directory("../build/static/css", filename)


@app.route("/static/js/<path:filename>")
def serve_js(filename):
    return send_from_directory("../build/static/js", filename)


@app.route("/static/media/<path:filename>")
def serve_media(filename):
    return send_from_directory("../build/static/media", filename)


@app.route("/favicon.svg")
def serve_favicon():
    return send_from_directory("../build", "favicon.svg")


@app.route("/dashboard")
def serve_dashboard():
    return send_from_directory("../build", "index.html")


@app.route("/auth-login")
def serve_auth_login():
    return send_from_directory("../build", "index.html")


@app.route("/chat")
def serve_chat():
    return send_from_directory("../build", "index.html")


@app.route("/config")
def serve_config():
    return send_from_directory("../build", "index.html")


# socket endpoints


@socketio.on("connect")
def connected():
    """event listener when client connects to the server"""
    print(request.sid)
    print("client has connected")
    logs = db_operations.get_all_execution_logs()
    messages = db_operations.get_all_messages()
    emit("connect:logs", {"data": f"id: {request.sid} is connected", "logs": logs})
    emit(
        "connect:messages",
        {"data": f"id: {request.sid} is connected", "messages": messages},
    )


@socketio.on("data")
def handle_message(data):
    """event listener when client types a message"""
    print("data from the front end: ", str(data))
    emit("data", {"data": data, "id": request.sid}, broadcast=True)


@socketio.on("disconnect")
def disconnected():
    """event listener when client disconnects to the server"""
    print("user disconnected")
    emit("disconnect", f"user {request.sid} disconnected", broadcast=True)


# API endpoints

# Define the /chat POST route
@app.route("/chat", methods=["POST"])
def chat():
    input_message = request.json.get("message", "")
    if not input_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    # add the message to the db
    message_id = db_operations.add_to_chat_service(input_message)

    # process input in a background thread
    thread = threading.Thread(
        target=processor.process_input, args=(input_message, message_id)
    )
    thread.start()

    return jsonify(
        {"message": "Message received successfully", "message_id": message_id}
    )


# CLEAR CHAT
@app.route("/clear_chat")
def clear_chat():
    messages = db_operations.get_all_messages()
    if len(messages) == 0:
        return jsonify({"error": "No messages to clear"}), 400
    db_operations.clear_all_messages()
    return jsonify({"message": "Chat cleared successfully"})


@app.route("/reset")
def reset():
    db_operations.reset_db()
    return jsonify({"result": "success"})


@app.route("/test")
def test():
    aws_credentials = db_operations.get_aws_credentials()
    openai_key = db_operations.get_openai_key()

    response_data = {
        "aws_credentials": {
            "aws_access_key": aws_credentials[0] if aws_credentials else None,
            "aws_secret_key": aws_credentials[1] if aws_credentials else None,
            "aws_region": aws_credentials[2] if aws_credentials else None,
        },
        "openai_key": openai_key,
    }

    return jsonify(response_data)


@app.route("/connect", methods=["POST"])
def connect():
    data = request.json
    # data = data["body"]

    # Validate required fields
    required_fields = [
        "aws_access_key",
        "aws_secret_key",
        "aws_region",
        "openai_access_key",
    ]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return (
            jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}),
            400,
        )

    # Extract data from request
    aws_access_key = data["aws_access_key"]
    aws_secret_key = data["aws_secret_key"]
    aws_region = data["aws_region"]
    openai_access_key = data["openai_access_key"]

    # Store credentials
    db_operations.store_credentials(
        aws_access_key, aws_secret_key, aws_region, openai_access_key
    )

    return jsonify({"message": "Credentials stored successfully"})


@app.route("/test-command")
def test_command():
    thread = threading.Thread(target=processor.aws_cli_tool, args=("aws s3 ls",))
    thread.start()
    return jsonify({"message": "Command executed successfully"})


@app.route("/scan", methods=["POST"])
def scan():
    # To scan the services having resources
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing request body"}), 400

    # data = data.get("body")
    # logging.info(data)
    service_list = data.get("services")
    regions = data.get("regions")

    if not service_list:
        return jsonify({"error": "Missing services", "data": data}), 400
    if not regions:
        return jsonify({"error": "Missing regions"}), 400

    scan_id = db_operations.add_to_scan_queue(service_list, regions)
    # processor.scan_with_ai(service_list, regions, scan_id)
    # Start the scan in a background thread
    thread = threading.Thread(
        target=processor.scan_with_ai, args=(service_list, regions, scan_id)
    )
    thread.start()

    return jsonify({"message": "Scan started successfully", "scan_id": scan_id})


@app.route("/scan-status/<string:scan_id>")
def scan_status(scan_id):
    scan = db_operations.get_scan_status(scan_id)
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    return jsonify(scan)


@app.route("/findings")
def findings():
    scans = db_operations.get_all_scan_results()
    return jsonify(scans)


@app.route("/update-consent", methods=["POST"])
def update_consent():
    data = request.json
    id = data.get("id")
    consent = data.get("consent")
    if not id:
        return jsonify({"error": "Missing ID"}), 400
    if consent is None:
        return jsonify({"error": "Missing consent"}), 400
    if consent not in ["true", "false"]:
        return jsonify({"error": "Invalid consent"}), 400
    if consent == "true":
        consent = True
    else:
        consent = False
    operation = db_operations.update_scan_details(id, consent=consent)
    if operation:
        return jsonify({"result": "success"})
    else:
        return jsonify({"error": "Failed to update"}), 500


@app.route("/patch", methods=["POST"])
def patch():
    # get id from request and get the scan result from db
    data = request.get_json()
    id = data.get("id")
    scan = db_operations.get_scan_results_by_id(id)
    if not scan:
        return jsonify({"error": "Finding not found"}), 404
    if scan["fixed"]:
        return jsonify({"error": "Finding already fixed"}), 400
    if not scan["consent"]:
        return jsonify({"error": "Cannot fix without consent!"}), 400

    # add patch to patch queue
    patch_id = db_operations.add_to_patch_queue(id)

    # Start the patch in a background thread
    thread = threading.Thread(target=processor.patcher, args=(scan, patch_id))
    thread.start()

    return jsonify({"message": "Patch started successfully", "patch_id": patch_id})


@app.route("/patch-status/<string:patch_id>")
def patch_status(patch_id):
    patch = db_operations.get_patch_status(patch_id)
    if not patch:
        return jsonify({"error": "Patch not found"}), 404
    return jsonify(patch)


@app.route("/update_log_status/<string:id>", methods=["POST"])
def update_log_status(id):
    data = request.get_json()
    action = data.get("action")
    # check if already accepted or rejected
    execution = db_operations.get_execution_by_id(id)
    if not execution:
        return jsonify({"error": "Log not found"}), 404
    if execution["status"] != "pending":
        return jsonify({"error": "Log already processed"}), 400

    if action == "accept":
        db_operations.update_execution_status(id, "accepted")
        message = "Log accepted successfully"
    elif action == "reject":
        db_operations.update_execution_status(id, "rejected")
        message = "Log rejected successfully"
    else:
        return jsonify({"error": "Invalid action"}), 400

    return jsonify({"message": message}), 200


@app.route("/update_settings", methods=["POST"])
def update_settings():
    data = request.get_json()
    print("data:", data)

    # Validate model if provided
    if "openai_model" in data:
        available_models = app.config["OPENAI_MODELS"]
        if data["openai_model"] not in available_models:
            return jsonify({"error": "Invalid model"}), 400

        available = processor.check_model_access(data["openai_model"])
        if not available:
            return jsonify({"error": "Model not available"}), 400

    # Update all provided settings dynamically
    try:
        db_operations.update_settings(**data)  # Pass all received settings directly
    except Exception as e:
        return jsonify({"error": "Failed to update settings: " + str(e)}), 500

    return jsonify({"message": "Settings updated successfully"}), 200


@app.route("/settings")
def get_settings():
    settings = db_operations.get_settings()
    return jsonify(settings)


# get scan options
@app.route("/scan_options")
def get_scan_options():
    # send the available services and regions
    services = app.config["AWS_SERVICES"]
    regions = app.config["AWS_REGIONS"]
    return jsonify({"services": services, "regions": regions})


@app.route("/get_models")
def get_models():
    models = app.config["OPENAI_MODELS"]
    resp = [model for model in models if processor.check_model_access(model)]
    return jsonify(resp)
