variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR range for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR ranges for public subnets"
  type        = list(string)

  validation {
    condition     = length(var.public_subnet_cidrs) >= 2
    error_message = "At least two public subnet CIDRs are required for ALB and ECS high availability."
  }
}

variable "azs" {
  description = "Availability zones aligned by index with public_subnet_cidrs"
  type        = list(string)

  validation {
    condition     = length(var.azs) == length(var.public_subnet_cidrs)
    error_message = "azs and public_subnet_cidrs must have the same number of items."
  }
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
