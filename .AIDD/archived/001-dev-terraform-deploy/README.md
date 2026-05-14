# 001 — Dev Environment Terraform Deploy

## Summary

Deploy full AWS infrastructure for the `dev` environment using public Terraform modules, split into two independently-managed stacks: `01-network` (VPC layer) and `02-app` (application layer).

---

## Goals

| # | Goal | Success Metric |
|---|------|----------------|
| 1 | Provision reproducible dev infra via Terraform | `terraform apply` succeeds from scratch |
| 2 | Mirror production architecture at dev scale | All architectural components present |
| 3 | Keep stacks decoupled — network changes don't force app re-deploy | `02-app` reads `01-network` via remote state only |
| 4 | Cost-optimized for dev | Single NAT GW, min task count, no multi-AZ Redis |

---

## Decisions

| Question | Decision | Reason |
|----------|----------|--------|
| Custom modules vs public? | Public (`terraform-aws-modules/*`) only | Reuse battle-tested modules, avoid maintenance |
| Split strategy | `01-network` + `02-app` | Network is stable; app deploys often — decouple blast radius |
| State sharing between stacks | `terraform_remote_state` (S3 backend) | Standard pattern, no extra tooling needed |
| NAT Gateway count | 1 (single) | Dev cost saving; prod uses 2 for HA |
| Network Firewall | Excluded | Cost/complexity not justified for dev |
| Redis AZ | Single node | Dev cost saving |
| DynamoDB PITR | Disabled | Dev environment |
| WAF scope | CloudFront WAF in `us-east-1`, ALB WAF in `ap-southeast-1` | AWS constraint for CloudFront-attached WAF |
| ACM cert | `us-east-1` alias for CloudFront cert, `ap-southeast-1` for ALB | AWS constraint |
| Cognito | Raw `aws_cognito_user_pool` resource | No well-maintained public module |
| CloudFront | Raw `aws_cloudfront_distribution` resource | No standard `terraform-aws-modules` CF module |
| Route53 zone | `data` lookup of existing hosted zone | Zone assumed pre-existing |
| VPC CIDR | `10.0.0.0/16` | Avoids conflict with prod (`10.42.0.0/16`) |
| AWS Region | `ap-southeast-1` | Same as prod |

---

## Acceptance Criteria

- [ ] `01-network` applies cleanly and outputs: `vpc_id`, `public_subnet_ids`, `private_subnet_ids`, `db_subnet_ids`
- [ ] `02-app` reads `01-network` outputs via `terraform_remote_state`
- [ ] ECS Fargate service reaches RUNNING state with health check passing (`GET /api/health → 200`)
- [ ] ALB DNS resolves and routes traffic to ECS service
- [ ] CloudFront distribution fronts the ALB
- [ ] WAF associated with CloudFront distribution
- [ ] ACM cert issued and attached (CloudFront + ALB)
- [ ] ElastiCache Redis endpoint available to ECS tasks (security group allows access)
- [ ] DynamoDB table exists with correct name
- [ ] S3 bucket for image uploads created with private ACL
- [ ] Secrets Manager secret ARN injected into ECS task via `secrets` in container definition
- [ ] CloudWatch log group `/ecs/kicks-shoes-dev` created with 7-day retention
- [ ] All resources tagged with `Environment = dev`, `Project = kicks-shoes`, `ManagedBy = terraform`

---

## Target Path

```
infra/terraform/environments/dev/
├── 01-network/
└── 02-app/
```

---

## Detail Files

- [01-network.md](./01-network.md) — Network stack: VPC, subnets, NAT GW, outputs, state config
- [02-app.md](./02-app.md) — App stack: ALB, ECS, ElastiCache, DynamoDB, S3, CloudFront, WAF, Cognito, remote state wiring
