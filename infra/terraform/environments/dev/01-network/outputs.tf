output "vpc_id" {
  value = module.vpc.vpc_id
}

output "vpc_cidr" {
  value = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

output "db_subnet_ids" {
  value = module.vpc.database_subnets
}

output "db_subnet_group_name" {
  value = module.vpc.database_subnet_group_name
}

output "nat_public_ips" {
  value = module.vpc.nat_public_ips
}

# W5 MH2: firewall subnets
output "firewall_subnet_ids" {
  description = "Subnet IDs for Network Firewall endpoints"
  value       = module.vpc.intra_subnets
}

# W5 MH1: Flow Logs
output "flow_log_group_name" {
  description = "CloudWatch Log Group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.vpc.id
}

output "natgw_ids" {
  description = "List of NAT Gateway IDs"
  value       = module.vpc.natgw_ids
}

output "intra_route_table_ids" {
  description = "List of intra subnet route table IDs"
  value       = module.vpc.intra_route_table_ids
}
