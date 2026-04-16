output "table_name" {
  value = aws_dynamodb_table.this.name
}

output "table_arn" {
  value = aws_dynamodb_table.this.arn
}
output "table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.this.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.this.arn
}
