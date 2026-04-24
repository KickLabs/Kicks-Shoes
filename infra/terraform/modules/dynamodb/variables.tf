variable "table_name" {
  type = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
