variable "project_name" {
  type    = string
  default = "kicks-shoes-dev"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "domain_name" {
  type        = string
  description = "Root domain name, e.g. kicks-shoes.com"
}

variable "container_image" {
  type        = string
  description = "ECR image URI"
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
  default = 256
}

variable "task_memory" {
  type    = number
  default = 512
}

variable "autoscaling_min" {
  type    = number
  default = 1
}

variable "autoscaling_max" {
  type    = number
  default = 3
}

variable "autoscaling_cpu_target" {
  type    = number
  default = 60
}

variable "app_config_secret_name" {
  type        = string
  description = "Secrets Manager secret name"
  default     = "kicks-shoes-dev/app-config"
}

variable "tags" {
  type    = map(string)
  default = {}
}
