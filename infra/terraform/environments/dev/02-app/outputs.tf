output "alb_dns_name" {
  value = module.alb.dns_name
}

output "cloudfront_domain" {
  value = var.enable_custom_domain ? aws_cloudfront_distribution.main[0].domain_name : null
}

output "ecs_cluster_name" {
  value = local.ecs_cluster_name
}

output "ecs_service_name" {
  value = local.ecs_service_name
}

output "dynamodb_table_name" {
  value = module.dynamodb.dynamodb_table_id
}

output "s3_uploads_bucket" {
  value = module.s3_uploads.s3_bucket_id
}

output "redis_endpoint" {
  value     = module.elasticache.cluster_cache_nodes[0].address
  sensitive = true
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}
