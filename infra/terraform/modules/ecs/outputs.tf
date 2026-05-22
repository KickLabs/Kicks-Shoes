output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.this.name
}

output "service_id" {
  value = aws_ecs_service.this.id
}

output "security_group_id" {
  value = aws_security_group.ecs.id
}
