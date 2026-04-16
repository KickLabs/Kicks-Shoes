output "autoscaling_target_resource_id" {
  description = "Autoscaling target resource ID"
  value       = aws_appautoscaling_target.ecs.resource_id
}

output "autoscaling_policy_arn" {
  description = "Autoscaling policy ARN"
  value       = aws_appautoscaling_policy.cpu_target_tracking.arn
}
