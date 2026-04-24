# DynamoDB Module Outputs

output "dynamodb_table_arn" {
  description = "ARN of the main DynamoDB table"
  value       = aws_dynamodb_table.this.arn
}

output "dynamodb_table_name" {
  description = "Name of the main DynamoDB table"
  value       = aws_dynamodb_table.this.name
}

output "dynamodb_table_id" {
  description = "ID of the main DynamoDB table"
  value       = aws_dynamodb_table.this.id
}

# Chat Messages Table Outputs
output "chat_messages_table_arn" {
  description = "ARN of the chat messages DynamoDB table"
  value       = aws_dynamodb_table.chat_messages.arn
}

output "chat_messages_table_name" {
  description = "Name of the chat messages DynamoDB table"
  value       = aws_dynamodb_table.chat_messages.name
}

output "chat_messages_stream_arn" {
  description = "ARN of the DynamoDB stream for chat messages"
  value       = aws_dynamodb_table.chat_messages.stream_arn
}

output "chat_messages_stream_label" {
  description = "Label of the DynamoDB stream for chat messages"
  value       = aws_dynamodb_table.chat_messages.stream_label
}
