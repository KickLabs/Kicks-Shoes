variable "name_prefix" {
  description = "Prefix for autoscaling resources"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "service_name" {
  description = "ECS service name"
  type        = string
}

variable "min_capacity" {
  description = "Minimum desired task count"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum desired task count"
  type        = number
  default     = 6
}

variable "target_cpu_utilization" {
  description = "Target average CPU utilization percentage"
  type        = number
  default     = 60
}

variable "scale_in_cooldown_seconds" {
  description = "Cooldown in seconds for scale-in"
  type        = number
  default     = 180
}

variable "scale_out_cooldown_seconds" {
  description = "Cooldown in seconds for scale-out"
  type        = number
  default     = 60
}
