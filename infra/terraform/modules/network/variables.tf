variable "project_name" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "azs" {
  type = list(string)

  validation {
    condition     = length(var.azs) == 2
    error_message = "Provide exactly 2 availability zones."
  }
}

variable "public_subnet_cidrs" {
  type = list(string)

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Provide exactly 2 public subnet CIDRs."
  }
}

variable "private_subnet_cidrs" {
  type = list(string)

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "Provide exactly 2 private subnet CIDRs."
  }
}

variable "nat_gateway_count" {
  type    = number
  default = 1

  validation {
    condition     = var.nat_gateway_count >= 1 && var.nat_gateway_count <= 2
    error_message = "nat_gateway_count must be between 1 and 2."
  }
}

variable "tags" {
  type    = map(string)
  default = {}
}
