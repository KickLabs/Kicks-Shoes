output "vpc_id" {
  description = "VPC ID"
  value       = module.network_secure.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.network_secure.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.network_secure.private_subnet_ids
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb_secure.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = module.edge_security.cloudfront_domain_name
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = module.edge_security.web_acl_arn
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs_secure.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs_secure.service_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}
