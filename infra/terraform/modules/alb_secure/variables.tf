variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs where ALB is deployed"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDRs for ALB egress restriction"
  type        = list(string)
}

variable "target_group_port" {
  description = "Target port for ECS service"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/api/health"
}

variable "health_check_matcher" {
  description = "Expected success HTTP codes"
  type        = string
  default     = "200-399"
}

variable "restrict_to_cloudfront" {
  description = "Allow ALB ingress only from CloudFront origin-facing managed prefix list"
  type        = bool
  default     = true
}

variable "origin_verify_header_name" {
  description = "Header name used by CloudFront to reach ALB"
  type        = string
  default     = "x-origin-verify"
}

variable "origin_verify_header_value" {
  description = "Header value used by CloudFront to reach ALB"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
