variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "container_image" {
  type      = string
  sensitive = true
}

variable "container_port" {
  type    = number
  default = 3000
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "task_cpu" {
  type    = number
  default = 512
}

variable "task_memory" {
  type    = number
  default = 1024
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "target_group_arn" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "app_config_secret_arn" {
  type = string
}

variable "app_config_secret_keys" {
  type    = list(string)
  default = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
