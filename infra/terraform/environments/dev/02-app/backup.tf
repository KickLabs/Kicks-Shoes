# =============================================================================
# W5 MH3 — AWS Backup Plan
# Covers: EFS + DynamoDB chat table
# Schedule: daily 2AM UTC | Retention: 7 days
# =============================================================================

# -----------------------------------------------------------------------------
# Backup Vault
# -----------------------------------------------------------------------------
resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault"
  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# IAM Role for AWS Backup
# -----------------------------------------------------------------------------
resource "aws_iam_role" "backup" {
  name = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "backup.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "backup_policy" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore_policy" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# EFS requires additional S3 restore policy
resource "aws_iam_role_policy_attachment" "backup_s3_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/AWSBackupServiceRolePolicyForS3Restore"
}

resource "aws_iam_role_policy_attachment" "backup_s3_backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/AWSBackupServiceRolePolicyForS3Backup"
}

# -----------------------------------------------------------------------------
# Backup Plan — daily schedule, 7-day retention
# -----------------------------------------------------------------------------
resource "aws_backup_plan" "daily" {
  name = "${var.project_name}-daily-backup"

  rule {
    rule_name         = "daily-2am-utc"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # 2 AM UTC daily

    start_window      = 60  # minutes to start after scheduled time
    completion_window = 180 # minutes to complete

    lifecycle {
      delete_after = 7 # 7-day retention
    }

    recovery_point_tags = local.common_tags
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Backup Selections
# -----------------------------------------------------------------------------

# S3 uploads backup
resource "aws_backup_selection" "s3_uploads" {
  name         = "${var.project_name}-s3-uploads-backup"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [module.s3_uploads.s3_bucket_arn]
}

# DynamoDB chat messages table backup
resource "aws_backup_selection" "dynamodb_chat" {
  name         = "${var.project_name}-dynamodb-chat-backup"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [module.dynamodb_chat.chat_messages_table_arn]
}

# DynamoDB main table backup
resource "aws_backup_selection" "dynamodb_main" {
  name         = "${var.project_name}-dynamodb-main-backup"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [module.dynamodb_chat.dynamodb_table_arn]
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "backup_vault_name" {
  description = "AWS Backup vault name"
  value       = aws_backup_vault.main.name
}

output "backup_vault_arn" {
  description = "AWS Backup vault ARN"
  value       = aws_backup_vault.main.arn
}

output "backup_plan_id" {
  description = "AWS Backup plan ID"
  value       = aws_backup_plan.daily.id
}

output "backup_role_arn" {
  description = "IAM role ARN for AWS Backup (use when triggering manual backup jobs)"
  value       = aws_iam_role.backup.arn
}
