# =============================================================================
# W6 MH-SEC Supporting Control — KMS Customer Managed Key
# Apply to S3 uploads bucket for audit trail on data access
# Cost: $1/month/key — justified for e-commerce upload data audit trail
# =============================================================================

resource "aws_kms_key" "s3_uploads" {
  description             = "CMK for ${var.project_name} S3 uploads bucket"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableIAMUserPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowS3Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-cmk"
  })
}

resource "aws_kms_alias" "s3_uploads" {
  name          = "alias/${var.project_name}-s3-uploads"
  target_key_id = aws_kms_key.s3_uploads.key_id
}

output "kms_key_arn" {
  description = "KMS CMK ARN for S3 uploads bucket"
  value       = aws_kms_key.s3_uploads.arn
}

output "kms_key_alias" {
  description = "KMS CMK alias"
  value       = aws_kms_alias.s3_uploads.name
}
