terraform {
  required_providers {
    aws = {
      version = ">= 4.0.0"
      source  = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ca-central-1"
}

locals {
  create_function_name = "create-obituary-30147366"
  create_handler_name  = "main.create_obituaries_30147366"
  create_artifact_name = "create_artifact.zip"
}

locals {
  get_function_name = "get-obituary-30147366"
  get_handler_name  = "main.get_obituaries_30147366"
  get_artifact_name = "get_artifact.zip"
}

resource "aws_iam_role" "create_lambda" {
  name               = "iam-for-lambda-${local.create_function_name}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "get_lambda" {
  name               = "iam-for-lambda-${local.get_function_name}"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "logs_create" {
  name        = "lambda-logging-${local.create_function_name}"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "polly:SynthesizeSpeech"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.obituaries.arn}", "*"],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_policy" "logs_get" {
  name        = "lambda-logging-${local.get_function_name}"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": ["arn:aws:logs:*:*:*", "${aws_dynamodb_table.obituaries.arn}", "*"],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs_create" {
  role       = aws_iam_role.create_lambda.name
  policy_arn = aws_iam_policy.logs_create.arn
}

resource "aws_iam_role_policy_attachment" "lambda_logs_get" {
  role       = aws_iam_role.get_lambda.name
  policy_arn = aws_iam_policy.logs_get.arn
}

data "archive_file" "create_lambda" {
  type       = "zip"
  source_dir = "../functions/create-obituary"
  #output_path = "/functions/create-obituary/artifact.zip"
  output_path = "create_artifact.zip"
}

data "archive_file" "get_lambda" {
  type        = "zip"
  source_file = "../functions/get-obituaries/main.py"
  #output_path = "/functions/create-obituary/artifact.zip"
  output_path = "get_artifact.zip"
}


resource "aws_lambda_function" "get" {
  role             = aws_iam_role.get_lambda.arn
  function_name    = local.get_function_name
  handler          = local.get_handler_name
  filename         = local.get_artifact_name
  source_code_hash = data.archive_file.get_lambda.output_base64sha256
  runtime          = "python3.9"
}

resource "aws_lambda_function" "create" {
  role             = aws_iam_role.create_lambda.arn
  function_name    = local.create_function_name
  handler          = local.create_handler_name
  filename         = local.create_artifact_name
  source_code_hash = data.archive_file.create_lambda.output_base64sha256
  runtime          = "python3.9"
  timeout          = 20
}

resource "aws_lambda_function_url" "get_URL" {
  function_name      = aws_lambda_function.get.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["GET"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

resource "aws_lambda_function_url" "create_URL" {
  function_name      = aws_lambda_function.create.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["POST"]
    allow_headers     = ["*"]
    expose_headers    = ["keep-alive", "date"]
  }
}

output "create_lambda_url" {
  value = aws_lambda_function_url.create_URL.function_url
}

output "get_lambda_url" {
  value = aws_lambda_function_url.get_URL.function_url
}

resource "aws_dynamodb_table" "obituaries" {
  name         = "obituaries-30149694"
  billing_mode = "PROVISIONED"

  read_capacity  = 1
  write_capacity = 1

  # hash_key is the uuid for an obituary
  hash_key = "id"

  # the hash_key data type is string
  attribute {
    name = "id"
    type = "S"
  }
}
