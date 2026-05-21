output "alb_dns_name" {
  value = module.alb.dns_name
}

output "cloudfront_domain" {
  value = var.enable_custom_domain ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "ecs_cluster_name" {
  value = local.ecs_cluster_name
}

output "ecs_service_name" {
  value = local.ecs_service_name
}

output "dynamodb_table_name" {
  value = module.dynamodb_chat.dynamodb_table_id
}

output "s3_uploads_bucket" {
  value = module.s3_uploads.s3_bucket_id
}

output "redis_endpoint" {
  value     = module.elasticache.cluster_cache_nodes[0].address
  sensitive = true
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}

# ============================================================================
# Lambda Outputs
# ============================================================================

output "lambda_function_name" {
  description = "Name of the Bedrock chat Lambda function"
  value       = module.lambda_bedrock_chat.lambda_function_name
}

output "lambda_function_arn" {
  description = "ARN of the Bedrock chat Lambda function"
  value       = module.lambda_bedrock_chat.lambda_function_arn
}

output "lambda_cloudwatch_log_group" {
  description = "CloudWatch Log Group for Lambda function"
  value       = module.lambda_bedrock_chat.cloudwatch_log_group_name
}

# ============================================================================
# DynamoDB Chat Table Outputs
# ============================================================================

output "dynamodb_chat_table_name" {
  description = "Name of the DynamoDB chat messages table"
  value       = module.dynamodb_chat.chat_messages_table_name
}

output "dynamodb_chat_table_arn" {
  description = "ARN of the DynamoDB chat messages table"
  value       = module.dynamodb_chat.chat_messages_table_arn
}

output "dynamodb_chat_stream_arn" {
  description = "ARN of the DynamoDB stream for chat messages"
  value       = module.dynamodb_chat.chat_messages_stream_arn
}

# ============================================================================
# VPC Endpoint Outputs (Must-have 4 Evidence)
# ============================================================================

output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC Gateway Endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "s3_vpc_endpoint_state" {
  description = "State of the S3 VPC Gateway Endpoint"
  value       = aws_vpc_endpoint.s3.state
}

output "dynamodb_vpc_endpoint_id" {
  description = "ID of the DynamoDB VPC Gateway Endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "dynamodb_vpc_endpoint_state" {
  description = "State of the DynamoDB VPC Gateway Endpoint"
  value       = aws_vpc_endpoint.dynamodb.state
}

# =============================================================================
# W5 Outputs
# =============================================================================

output "api_gateway_invoke_url" {
  description = "API Gateway URL — set as VITE_BEDROCK_API_URL in frontend .env"
  value       = aws_apigatewayv2_api.bedrock.api_endpoint
}

output "bedrock_dlq_url" {
  description = "SQS DLQ URL for failed bedrock-chat invocations"
  value       = module.lambda_bedrock_chat.dlq_url
}

output "bedrock_dlq_arn" {
  description = "SQS DLQ ARN"
  value       = module.lambda_bedrock_chat.dlq_arn
}

