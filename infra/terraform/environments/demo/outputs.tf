output "alb_dns_name" {
  description = "DNS endpoint of ALB"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs.service_name
}

output "task_definition_arn" {
  description = "Task definition ARN"
  value       = module.ecs.task_definition_arn
}

output "autoscaling_policy_arn" {
  description = "Autoscaling policy ARN"
  value       = module.autoscaling.autoscaling_policy_arn
}
