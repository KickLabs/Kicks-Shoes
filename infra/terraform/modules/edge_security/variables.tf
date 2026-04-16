variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "alb_dns_name" {
  description = "Public ALB DNS name"
  type        = string
}

variable "origin_verify_header_name" {
  description = "Header name forwarded by CloudFront to ALB"
  type        = string
}

variable "origin_verify_header_value" {
  description = "Header value forwarded by CloudFront to ALB"
  type        = string
  sensitive   = true
}

variable "web_acl_rate_limit" {
  description = "Rate-based limit per 5-minute period"
  type        = number
  default     = 2000
}

variable "tags" {
  description = "Tags applied to resources"
  type        = map(string)
  default     = {}
}
