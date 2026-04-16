variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for ALB resources"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for ALB"
  type        = list(string)
}

variable "target_group_port" {
  description = "Target group port"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "ALB health check path"
  type        = string
  default     = "/api/health"
}

variable "health_check_matcher" {
  description = "HTTP matcher for health checks"
  type        = string
  default     = "200-399"
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
