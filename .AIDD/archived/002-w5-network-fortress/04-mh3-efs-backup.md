# 04 — MH3: EFS File Storage + AWS Backup

## Use Case trong Kicks Shoes

EFS phục vụ **shared product image cache** và **uploaded files** giữa các ECS tasks. Khi scale lên nhiều task, mỗi task cần đọc cùng file — EFS giải quyết vấn đề này.

Mount path: `/mnt/efs`
- `/mnt/efs/uploads/` — product images upload từ seller
- `/mnt/efs/cache/` — AI-generated image descriptions cache

---

## Terraform — EFS

Tạo `infra/terraform/environments/dev/02-app/efs.tf`:

```hcl
# Security Group cho EFS Mount Target
module "sg_efs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-efs-sg"
  description = "EFS: allow NFS 2049 from ECS only"
  vpc_id      = data.terraform_remote_state.network.outputs.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 2049
      to_port                  = 2049
      protocol                 = "tcp"
      source_security_group_id = module.sg_ecs.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules = ["all-all"]

  tags = local.common_tags
}

# EFS File System
resource "aws_efs_file_system" "main" {
  creation_token   = "${var.project_name}-efs"
  performance_mode = "generalPurpose"
  throughput_mode  = "bursting"
  encrypted        = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-efs"
  })
}

# Mount Targets — 1 per private subnet AZ
resource "aws_efs_mount_target" "private" {
  count           = length(data.terraform_remote_state.network.outputs.private_subnet_ids)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = data.terraform_remote_state.network.outputs.private_subnet_ids[count.index]
  security_groups = [module.sg_efs.security_group_id]
}

# EFS Access Point
resource "aws_efs_access_point" "app" {
  file_system_id = aws_efs_file_system.main.id

  posix_user {
    gid = 1000
    uid = 1000
  }

  root_directory {
    path = "/app-data"
    creation_info {
      owner_gid   = 1000
      owner_uid   = 1000
      permissions = "755"
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-efs-ap"
  })
}

output "efs_id" {
  value = aws_efs_file_system.main.id
}

output "efs_access_point_id" {
  value = aws_efs_access_point.app.id
}
```

---

## ECS Task Definition — Mount EFS

Cập nhật `module "ecs_service"` trong `main.tf`:

```hcl
module "ecs_service" {
  # ... existing config ...

  # Thêm EFS volume
  volume = [
    {
      name = "efs-app-data"
      efs_volume_configuration = {
        file_system_id          = aws_efs_file_system.main.id
        transit_encryption      = "ENABLED"
        authorization_config = {
          access_point_id = aws_efs_access_point.app.id
          iam             = "ENABLED"
        }
      }
    }
  ]

  container_definitions = {
    app = {
      # ... existing config ...
      
      # Mount EFS vào container
      mount_points = [
        {
          sourceVolume  = "efs-app-data"
          containerPath = "/mnt/efs"
          readOnly      = false
        }
      ]
    }
  }
}
```

Thêm IAM permission cho ECS task role:

```hcl
resource "aws_iam_policy" "ecs_efs" {
  name = "${var.project_name}-ecs-efs-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:ClientRootAccess"
      ]
      Resource = aws_efs_file_system.main.arn
    }]
  })
}
```

---

## Test EFS Mount

```bash
# ECS Exec vào task
aws ecs execute-command \
  --cluster kicks-shoes-dev-cluster \
  --task <task-id> \
  --container app \
  --interactive \
  --command "/bin/sh"

# Trong container
ls /mnt/efs
echo "W5 EFS test - $(date)" > /mnt/efs/test.txt
cat /mnt/efs/test.txt
# Expected: "W5 EFS test - <timestamp>"
```

**Chụp screenshot** output của `cat /mnt/efs/test.txt` cho Evidence Pack.

---

## Terraform — AWS Backup

Tạo `infra/terraform/environments/dev/02-app/backup.tf`:

```hcl
# Backup Vault
resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault"
  tags = local.common_tags
}

# IAM Role cho AWS Backup
resource "aws_iam_role" "backup" {
  name = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_iam_role_policy_attachment" "backup_restore" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

# Backup Plan
resource "aws_backup_plan" "daily" {
  name = "${var.project_name}-daily-backup"

  rule {
    rule_name         = "daily-backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)"  # 2 AM UTC daily

    lifecycle {
      delete_after = 7  # 7 ngày retention
    }

    recovery_point_tags = local.common_tags
  }

  tags = local.common_tags
}

# Backup Selection — EFS
resource "aws_backup_selection" "efs" {
  name         = "${var.project_name}-efs-backup"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [aws_efs_file_system.main.arn]
}

# Backup Selection — DynamoDB
resource "aws_backup_selection" "dynamodb" {
  name         = "${var.project_name}-dynamodb-backup"
  plan_id      = aws_backup_plan.daily.id
  iam_role_arn = aws_iam_role.backup.arn

  resources = [module.dynamodb.table_arn]
}
```

---

## Restore Test (Manual — bắt buộc)

```bash
# 1. Trigger backup ngay (không đợi schedule)
aws backup start-backup-job \
  --backup-vault-name kicks-shoes-dev-backup-vault \
  --resource-arn <efs-arn> \
  --iam-role-arn <backup-role-arn> \
  --region ap-southeast-1

# 2. Đợi backup complete
aws backup describe-backup-job --backup-job-id <job-id>

# 3. Lấy recovery point ARN
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name kicks-shoes-dev-backup-vault

# 4. Trigger restore
aws backup start-restore-job \
  --recovery-point-arn <recovery-point-arn> \
  --iam-role-arn <backup-role-arn> \
  --resource-type EFS \
  --metadata '{"file-system-id":"<efs-id>","Encrypted":"true","PerformanceMode":"generalPurpose","newFileSystem":"true"}'

# 5. Verify restore completed
aws backup describe-restore-job --restore-job-id <restore-job-id>
# Status phải là COMPLETED

# 6. Mount restored EFS và đọc data
# (mount vào EC2 test hoặc ECS task mới)
```

**Chụp screenshot:**
1. Backup job status = COMPLETED
2. Restore job status = COMPLETED
3. Data đọc được từ restored EFS

---

## Evidence Pack — MH3 Section

```markdown
## MH3 — File Storage + Backup Plan

**EFS:**
- File system ID: fs-xxxxxxxx
- Mount path: /mnt/efs trong ECS container
- Use case: shared product image uploads + AI description cache
- SG: chỉ allow NFS 2049 từ ECS SG (sg-xxxxxxxx)

[Screenshot: EFS console — file system AVAILABLE]
[Screenshot: Mount targets — 2 AZ]
[Screenshot: ECS Exec — cat /mnt/efs/test.txt output]

**AWS Backup:**
- Vault: kicks-shoes-dev-backup-vault
- Plan: daily 2AM UTC, retention 7 ngày
- Resources: EFS (fs-xxxxxxxx) + DynamoDB (kicks-shoes-dev-table)

[Screenshot: Backup plan console]
[Screenshot: Recovery points list]
[Screenshot: Backup job COMPLETED]
[Screenshot: Restore job COMPLETED]
[Screenshot: Data đọc được từ restored resource]
```
