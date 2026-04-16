variable "cluster_name" {
  type = string
}

variable "service_name" {
  type = string
}

variable "min_capacity" {
  type    = number
  default = 1
}

variable "max_capacity" {
  type    = number
  default = 4
}

variable "cpu_target" {
  type    = number
  default = 60
}
