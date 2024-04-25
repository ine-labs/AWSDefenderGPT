class Config:
    # For Running Local Socket Server
    SECRET_KEY = "kjkjsdfnwei8jbqedf892354uohgy2q34kmdswf9uy"
    OPENAI_MODELS = ["gpt-3.5-turbo", "gpt-4-turbo-preview"]
    AWS_SERVICES = [
        "ec2",
        "s3",
        "rds",
        "lambda",
        "dynamodb",
        "sqs",
        "sns",
        "ecs",
        "eks",
        "kms",
        "iam",
        "ebs",
    ]
    AWS_REGIONS = [
        "us-east-1",
        "us-west-1",
        "us-west-2",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-central-1",
        "eu-north-1",
        "ap-south-1",
        "ap-northeast-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "sa-east-1",
        "ca-central-1",
    ]
