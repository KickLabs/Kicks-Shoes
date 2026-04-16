variable "name_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name. If empty, generated from name_prefix"
  type        = string
  default     = ""
}

variable "hash_key" {
  description = "Partition key attribute name"
  type        = string
  default     = "pk"
}

variable "hash_key_type" {
  description = "Partition key type"
  type        = string
  default     = "S"
}

variable "range_key" {
  description = "Sort key attribute name"
  type        = string
  default     = "sk"
}

variable "range_key_type" {
  description = "Sort key type"
  type        = string
  default     = "S"
}

variable "enable_deletion_protection" {
  description = "Enable DynamoDB deletion protection"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default     = {}
}
