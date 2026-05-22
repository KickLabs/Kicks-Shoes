# =============================================================================
# W5 MH3 — Amazon EFS File Storage
# Use case: shared product image uploads + AI description cache across ECS tasks
# Mount path in container: /mnt/efs
# =============================================================================

# -----------------------------------------------------------------------------
# Security Group — EFS Mount Targets
# Only allow NFS (2049) from ECS task SG
# -----------------------------------------------------------------------------
module "sg_efs" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${var.project_name}-efs-sg"
  description = "EFS: allow NFS 2049 from ECS tasks only"
  vpc_id      = local.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 2049
      to_port                  = 2049
      protocol                 = "tcp"
      source_security_group_id = module.sg_ecs.security_group_id
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1
  egress_rules                                             = ["all-all"]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# EFS File System
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# Mount Targets — one per private subnet AZ
# -----------------------------------------------------------------------------
resource "aws_efs_mount_target" "private" {
  count           = length(local.private_subnet_ids)
  file_system_id  = aws_efs_file_system.main.id
  subnet_id       = local.private_subnet_ids[count.index]
  security_groups = [module.sg_efs.security_group_id]
}

# -----------------------------------------------------------------------------
# EFS Access Point — isolate app directory, avoid root access
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# IAM Policy — allow ECS task role to mount EFS
# Attached to tasks_iam_role via tasks_iam_role_statements in ecs_service
# -----------------------------------------------------------------------------
resource "aws_iam_policy" "ecs_efs" {
  name        = "${var.project_name}-ecs-efs-policy"
  description = "Allow ECS tasks to mount EFS file system"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "EFSMount"
      Effect = "Allow"
      Action = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:ClientRootAccess",
        "elasticfilesystem:DescribeMountTargets"
      ]
      Resource = aws_efs_file_system.main.arn
    }]
  })

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------
output "efs_id" {
  description = "EFS file system ID"
  value       = aws_efs_file_system.main.id
}

output "efs_dns_name" {
  description = "EFS DNS name for mounting"
  value       = aws_efs_file_system.main.dns_name
}

output "efs_access_point_id" {
  description = "EFS Access Point ID"
  value       = aws_efs_access_point.app.id
}

output "efs_sg_id" {
  description = "Security Group ID for EFS mount targets"
  value       = module.sg_efs.security_group_id
}
