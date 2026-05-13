# 01-network — Network Stack

**Path:** `infra/terraform/environments/dev/01-network/`
**State key:** `dev/01-network/terraform.tfstate`

---

## Purpose

Provision the VPC layer for dev. All networking resources live here. The `02-app` stack consumes outputs via `terraform_remote_state` — no direct module coupling.

---

## File Tree

```
01-network/
├── main.tf                   # vpc module call
├── variables.tf
├── outputs.tf                # consumed by 02-app via remote state
├── providers.tf
├── versions.tf
└── terraform.tfvars.example
```

---

## Public Module

| Module | Version | Purpose |
|--------|---------|---------|
| `terraform-aws-modules/vpc/aws` | `~> 5.0` | VPC, subnets, IGW, NAT GW, route tables |

---

## Architecture

```
VPC 10.0.0.0/16  (ap-southeast-1)
│
├── Public subnets      10.0.0.0/24  (AZ-a)   ← ALB, NAT GW
│                       10.0.1.0/24  (AZ-b)   ← ALB
│
├── Private subnets     10.0.10.0/24 (AZ-a)   ← ECS Fargate tasks
│                       10.0.11.0/24 (AZ-b)
│
└── Database subnets    10.0.20.0/24 (AZ-a)   ← ElastiCache Redis
                        10.0.21.0/24 (AZ-b)
```

Single NAT Gateway on AZ-a (cost saving for dev).

---

## `main.tf`

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs              = slice(data.aws_availability_zones.available.names, 0, 2)
  public_subnets   = var.public_subnet_cidrs
  private_subnets  = var.private_subnet_cidrs
  database_subnets = var.db_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = true   # dev: 1 NAT GW
  one_nat_gateway_per_az = false

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group       = true
  create_database_subnet_route_table = true

  tags = local.common_tags

  public_subnet_tags = {
    Tier = "public"
  }
  private_subnet_tags = {
    Tier = "private"
  }
  database_subnet_tags = {
    Tier = "database"
  }
}
```

---

## `variables.tf`

```hcl
variable "project_name" {
  type    = string
  default = "kicks-shoes-dev"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.0.0/24", "10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "db_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
```

---

## `outputs.tf`

These outputs are consumed by `02-app` via `terraform_remote_state`.

```hcl
output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr" {
  value = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

output "db_subnet_ids" {
  value = module.vpc.database_subnets
}

output "db_subnet_group_name" {
  value = module.vpc.database_subnet_group_name
}

output "nat_public_ips" {
  value = module.vpc.nat_public_ips
}
```

---

## `providers.tf`

```hcl
provider "aws" {
  region = var.aws_region
}
```

---

## `versions.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "kicks-shoes-state-trang"
    key     = "dev/01-network/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true
    # dynamodb_table = "terraform-locks" 
  }
}
```

---

## `terraform.tfvars.example`

```hcl
project_name = "kicks-shoes-dev"
aws_region   = "ap-southeast-1"
vpc_cidr     = "10.0.0.0/16"

public_subnet_cidrs  = ["10.0.0.0/24", "10.0.1.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
db_subnet_cidrs      = ["10.0.20.0/24", "10.0.21.0/24"]

tags = {
  Owner = "dev-team"
}
```

---

## Deploy Commands

```bash
cd infra/terraform/environments/dev/01-network

terraform init
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

> **Prerequisite:** S3 bucket `kicks-shoes-tf-state` must exist before `terraform init`.
> Create once: `aws s3api create-bucket --bucket kicks-shoes-tf-state --region ap-southeast-1 --create-bucket-configuration LocationConstraint=ap-southeast-1`
