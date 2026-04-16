variable "project_name" {
  type    = string
  default = "kicks-shoes-prod"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "vpc_cidr" {
  type    = string
  default = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.42.0.0/24", "10.42.1.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.42.10.0/24", "10.42.11.0/24"]
}

variable "container_image" {
  type = string
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

variable "app_config_secret_arn" {
  type = string
}

variable "app_config_secret_keys" {
  type    = list(string)
  default = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI", "GOOGLE_AI_API_KEY"]
}

variable "dynamodb_table_name" {
  type    = string
  default = "kicks-shoes-prod"
}

variable "autoscaling_min" {
  type    = number
  default = 1
}

variable "autoscaling_max" {
  type    = number
  default = 4
}

variable "autoscaling_cpu_target" {
  type    = number
  default = 60
}

variable "tags" {
  type    = map(string)
  default = {}
}
