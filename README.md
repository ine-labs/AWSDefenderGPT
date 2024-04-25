# AWSDefenderGPT : Leveraging OpenAI to Secure AWS Cloud

<p align="center">
  <img src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/704884bf-2c47-4d1f-9d0c-5407bc420350" alt="AWSDefenderGPT">
</p>

AWSDefenderGPT is an AI tool designed to identify and rectify cloud misconfigurations by using Open AI GPT models. AWSDefenderGPT can understand complex queries to detect misconfigurations in cloud environments and provide fixes for them.

This tool merges the capabilities of automated deployment and configuration modification using AI, along with cloud SDK tools. As a result, it transforms into an AI-powered cloud manager that helps you ensure the security of the cloud environment by preventing misconfigurations. By centralizing the process, users can effortlessly address misconfigurations and excessively permissive policies in a single stage, simplifying the handling of potential future threats.


**Presented at**

- [BlackHat ASIA 2024](https://www.blackhat.com/asia-24/arsenal/schedule/index.html#awsdefendergpt-leveraging-openai-to-secure-aws-cloud-37689)

### Developed with :heart: by [INE](https://ine.com/) 

[<img src="https://user-images.githubusercontent.com/25884689/184508144-f0196d79-5843-4ea6-ad39-0c14cd0da54c.png" alt="drawing" width="200"/>](https://discord.gg/TG7bpETgbg)

## Built With

* OpenAI 
* Docker
* React
* Python 3
* Flask
* SQLite3 
 


# Getting Started

### Prerequisites

* An AWS Account
* AWS Access Key with Administrative Privileges
* OpenAI access key (GPT4 Recommended)
  

### Installation

Manually installing AWSDefenderGPT would require you to follow these steps:

(Note: This requires a linux machine with docker installed, with the /bin/bash shell available)

**Step 1.** Clone the repo
```sh
git clone https://github.com/ine-labs/AWSDefenderGPT.git
```

**Step 2.** Build the docker image.
```sh
cd AWSDefenderGPT
docker build -t awsdefendergpt .
```

**Step 3.** Launch the container
```sh
docker run -p 5000:5000 awsdefendergpt
```


###



**Recommended Browser:** Google Chrome

**Recommended Model:** GPT 4

**Note:** AWSDefenderGPT suggests commands before executing them, and commands are executed when you accept it from the monitor section in the right corner. By default, this feature is activated, and you can deactivate it by clicking the bell icon.

# Contributors

Sherin Stephen, Software Engineer (Cloud), INE <sstephen@ine.com>

Rishappreet Singh Moonga, Software Engineer (Cloud), INE <rmoon@ine.com>

Nishant Sharma, Director, Lab Platform, INE <nsharma@ine.com> (Guidance)


# Screenshots

### WebPage Preview
<img width="1512" alt="WebPage Preview" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/ed7d3273-9b84-427f-a1e9-444ae6713582">

### First Authenticate
<img width="1512" alt="First Authenticate" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/72b6f72a-cdd4-4a0b-909c-9d6547a7d23a">

### Dashboard to find AWS Account Vulnerabilities
<img width="1512" alt="Dashboard To Find AWS Account Vulnerabilities" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/9ad74a21-04b8-4154-9f12-54a6050bfd29">

### Accept or Reject the generated command
<img width="1512" alt="Accept or Reject the generated command" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/ea964b7d-36f1-4683-b2a9-120a861ba3e7">

### Fix it with a single click
<img width="1512" alt="Fix it with a single click" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/cb094e18-3771-4eb8-a9fa-a5d35868f7aa">

### Do simpler task or find info from your account on Chat tab
<img width="1512" alt="Do simpler task or Find info from your account on Chat tab" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/dcbc81e0-58eb-446c-8275-c6e8c1dfb4d2">

### Setting page to manage AI model 
<img width="1512" alt="Setting page to manage AI model" src="https://github.com/ine-labs/AWSDefenderGPT/assets/63499257/ead4a7dd-ac1e-468a-9a2f-dc2f4020ef97">


# License

This program is free software: you can redistribute it and/or modify it under the terms of the MIT License.

You should have received a copy of the MIT License along with this program. If not, see https://opensource.org/licenses/MIT.

## Warning

This tool utilizes AI and may make mistakes. It is not best suited for production-level AWS accounts. Any damages made are the responsibility of the user.

# Sister Projects

- [AWSGoat](https://github.com/ine-labs/AWSGoat)
- [AzureGoat](https://github.com/ine-labs/AzureGoat)
- [GCPGoat](https://github.com/ine-labs/GCPGoat)
- [GearGoat](https://github.com/ine-labs/GearGoat)
- [PA Toolkit (Pentester Academy Wireshark Toolkit)](https://github.com/pentesteracademy/patoolkit)
- [ReconPal: Leveraging NLP for Infosec](https://github.com/pentesteracademy/reconpal) 
- [VoIPShark: Open Source VoIP Analysis Platform](https://github.com/pentesteracademy/voipshark)
- [BLEMystique](https://github.com/pentesteracademy/blemystique)
