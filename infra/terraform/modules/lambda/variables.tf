# Lambda Module Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

variable "lambda_zip_path" {
  description = "Path to Lambda deployment package (zip file)"
  type        = string
  default     = "lambda-placeholder.zip"
}

variable "bedrock_kb_id" {
  description = "Bedrock Knowledge Base ID"
  type        = string
}

variable "bedrock_region" {
  description = "AWS region where Bedrock Knowledge Base is deployed"
  type        = string
  default     = "us-west-2"
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for chat messages"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "dynamodb_stream_arn" {
  description = "DynamoDB stream ARN for event source mapping"
  type        = string
}

variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 7
}

variable "vpc_config_enabled" {
  description = "Enable VPC configuration for Lambda"
  type        = bool
  default     = false
}

variable "subnet_ids" {
  description = "Subnet IDs for Lambda VPC configuration"
  type        = list(string)
  default     = []
}

variable "security_group_ids" {
  description = "Security group IDs for Lambda VPC configuration"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
