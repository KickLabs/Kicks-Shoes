provider "aws" {
  region = var.aws_region
  alias  = "main"
}

# Required for CloudFront WAF + ACM
provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}
