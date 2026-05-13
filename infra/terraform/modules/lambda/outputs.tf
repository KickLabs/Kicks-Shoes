# Lambda Module Outputs

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.bedrock_chat.arn
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.bedrock_chat.function_name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "event_source_mapping_uuid" {
  description = "UUID of the DynamoDB event source mapping"
  value       = aws_lambda_event_source_mapping.dynamodb_stream.uuid
}
