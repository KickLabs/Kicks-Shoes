# DynamoDB Table for Chat Messages with Stream enabled
# This table stores chat messages and triggers Lambda for Bedrock processing

resource "aws_dynamodb_table" "chat_messages" {
  name         = "${var.project_name}-chat-messages"
  billing_mode = "PAY_PER_REQUEST"
  
  # Primary key
  hash_key  = "pk"
  range_key = "sk"
  
  # Attributes
  attribute {
    name = "pk"
    type = "S"
  }
  
  attribute {
    name = "sk"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "messageType"
    type = "S"
  }
  
  # Global Secondary Index - Query messages by user
  global_secondary_index {
    name            = "UserMessagesIndex"
    hash_key        = "userId"
    range_key       = "sk"
    projection_type = "ALL"
  }
  
  # Global Secondary Index - Query by message type (user/ai)
  global_secondary_index {
    name            = "MessageTypeIndex"
    hash_key        = "messageType"
    range_key       = "sk"
    projection_type = "ALL"
  }
  
  # Enable DynamoDB Streams for Lambda trigger
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
  
  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled = true
  }
  
  # TTL for automatic message cleanup (optional - 90 days)
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-chat-messages"
    Purpose     = "Chat messages storage with Bedrock integration"
    StreamEnabled = "true"
  })
}
