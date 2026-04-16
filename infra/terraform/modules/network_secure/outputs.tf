output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = [for subnet in aws_subnet.public : subnet.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = [for subnet in aws_subnet.private : subnet.id]
}

output "private_subnet_cidrs" {
  description = "Private subnet CIDRs"
  value       = [for subnet in aws_subnet.private : subnet.cidr_block]
}

output "private_route_table_ids" {
  description = "Private route table IDs"
  value       = [for rt in aws_route_table.private : rt.id]
}

output "nat_gateway_ids" {
  description = "NAT gateway IDs"
  value       = [for nat in aws_nat_gateway.this : nat.id]
}

output "dynamodb_gateway_endpoint_id" {
  description = "DynamoDB gateway endpoint ID"
  value       = try(aws_vpc_endpoint.dynamodb[0].id, null)
}
