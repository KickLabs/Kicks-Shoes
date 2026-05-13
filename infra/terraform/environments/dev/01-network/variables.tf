variable "project_name" {
  type    = string
  default = "kicks-shoes-dev"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
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

# W5 MH2: firewall subnets
variable "firewall_subnet_cidrs" {
  type        = list(string)
  default     = ["10.0.30.0/24", "10.0.31.0/24"]
  description = "CIDR blocks for Network Firewall subnets (one per AZ)"
}

variable "tags" {
  type    = map(string)
  default = {}
}
