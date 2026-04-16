variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR range for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDRs for public subnets (ALB/NAT)"
  type        = list(string)

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Exactly 2 public subnets are required."
  }

  validation {
    condition     = length(var.public_subnet_cidrs) == length(var.azs)
    error_message = "public_subnet_cidrs must match azs length."
  }
}

variable "private_subnet_cidrs" {
  description = "CIDRs for private subnets (ECS tasks)"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Exactly 2 private subnets are required."
  }

  validation {
    condition     = length(var.private_subnet_cidrs) == length(var.azs)
    error_message = "private_subnet_cidrs must match azs length."
  }
}

variable "azs" {
  description = "Two availability zones"
  type        = list(string)

  validation {
    condition     = length(var.azs) == 2
    error_message = "Exactly 2 AZs are required."
  }
}

variable "enable_dynamodb_gateway_endpoint" {
  description = "Enable DynamoDB gateway VPC endpoint for private route tables"
  type        = bool
  default     = true
}

variable "dynamodb_endpoint_policy_json" {
  description = "Optional JSON endpoint policy for DynamoDB endpoint"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
