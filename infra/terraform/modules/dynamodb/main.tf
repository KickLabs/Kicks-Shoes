resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = var.table_name
  })
}
locals {
  resolved_table_name = var.table_name != "" ? var.table_name : "${var.name_prefix}-app"
}

resource "aws_dynamodb_table" "this" {
  name         = local.resolved_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = var.hash_key
  range_key    = var.range_key

  attribute {
    name = var.hash_key
    type = var.hash_key_type
  }

  attribute {
    name = var.range_key
    type = var.range_key_type
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  deletion_protection_enabled = var.enable_deletion_protection

  tags = merge(var.tags, {
    Name = local.resolved_table_name
  })
}
