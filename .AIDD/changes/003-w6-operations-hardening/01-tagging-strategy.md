# 01 — Tagging Strategy (W6 MH-COST-V)

## Tagging Strategy Document — Kicks Shoes

### Required Tag Keys

| Tag Key | Allowed Values | Rule |
|---------|---------------|------|
| `Owner` | `team-lead@email.com` | Email của người chịu trách nhiệm — viết thường, nhất quán |
| `Environment` | `dev` | Chỉ dùng `dev` trong workshop account — không dùng `Dev`, `DEV` |
| `CostCenter` | `G13` | Group ID — không thay đổi |
| `Application` | `KicksShoes` | Tên app — không dùng `kicks-shoes`, `kicksshoes`, `Kicks Shoes` |

### Terraform Implementation

Thêm vào `variables.tf` của cả `01-network` và `02-app`:

```hcl
variable "tags" {
  type = map(string)
  default = {
    Owner       = "team-lead@email.com"
    CostCenter  = "G13"
    Application = "KicksShoes"
  }
}
```

`common_tags` trong `locals` sẽ merge thêm `Environment`, `Project`, `ManagedBy`:

```hcl
locals {
  common_tags = merge(var.tags, {
    Project     = "kicks-shoes"
    Environment = "dev"
    ManagedBy   = "terraform"
  })
}
```

### Resources phải có đủ 4 tags

- ECS Cluster + Service
- ALB
- Lambda functions (bedrock-chat, jwt-authorizer, cost-guard, security-guard)
- S3 buckets (uploads)
- DynamoDB tables
- EFS file system
- ElastiCache Redis cluster
- CloudWatch Log Groups
- SNS topics
- SQS queues (DLQ)
- API Gateway
- Network Firewall
- Backup Vault

### Activation Steps (thủ công — không làm được bằng Terraform)

1. AWS Console → Billing → Cost allocation tags
2. Tìm `Owner` → click Activate
3. Tìm `Application` → click Activate
4. Chờ 24h để tags xuất hiện trong Cost Explorer

### Enforcement trong Production

- AWS Config rule `required-tags` — tự động flag resources thiếu tags
- SCP (Service Control Policy) deny `ec2:RunInstances` nếu thiếu required tags
- Tag Policy trong AWS Organizations
