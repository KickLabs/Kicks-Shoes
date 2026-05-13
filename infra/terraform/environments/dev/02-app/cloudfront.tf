# =============================================================================
# CloudFront Distribution in front of Backend ALB (Enable HTTPS for free)
# Resolves Mixed Content policy blocking HTTP calls from secure Frontends
# =============================================================================

locals {
  alb_origin_id = "backendALB"
}

resource "aws_cloudfront_distribution" "backend" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "CloudFront proxy for ${var.project_name} Backend ALB"
  price_class     = "PriceClass_100"

  origin {
    domain_name = module.alb.dns_name
    origin_id   = local.alb_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.alb_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Forward specific whitelist headers, cookies, query strings to Backend ALB to improve caching
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept", "Content-Type"]

      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

output "backend_cloudfront_url" {
  description = "Secure HTTPS URL proxying to Backend ALB"
  value       = "https://${aws_cloudfront_distribution.backend.domain_name}"
}
