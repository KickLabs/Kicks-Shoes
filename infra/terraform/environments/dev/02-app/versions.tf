terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "kicks-shoes-tf-state"
    key     = "dev/02-app/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true
  }
}
