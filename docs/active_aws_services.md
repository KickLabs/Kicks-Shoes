# Danh sách Dịch vụ AWS đang chạy (Environment: dev)

Danh sách liệt kê toàn bộ các tài nguyên đang hoạt động có gắn tag `Environment=dev` kèm theo mục đích và tuần triển khai.

| Loại Dịch vụ | Tuần tạo | Mục đích | Tên / Resource ID | ARN |
|---|---|---|---|---|
| **apigateway** | W5 | Cổng HTTP API bọc Lambda, Throttling | `arn:aws:apigateway:us-east-1::/apis/tzvjf3doba` | `arn:aws:apigateway:us-east-1::/apis/tzvjf3doba` |
| **apigateway** | W5 | Cổng HTTP API bọc Lambda, Throttling | `arn:aws:apigateway:us-east-1::/apis/tzvjf3doba/stages/$default` | `arn:aws:apigateway:us-east-1::/apis/tzvjf3doba/stages/$default` |
| **application-autoscaling** | W1 | Tự động mở rộng (Scale) ECS Fargate | `scalable-target/0ec5a410b36c9b754abe9cc8f03cb204b294` | `arn:aws:application-autoscaling:us-east-1:962533717758:scalable-target/0ec5a410b36c9b754abe9cc8f03cb204b294` |
| **backup** | W5 | Tự động sao lưu EFS, DynamoDB | `backup-plan:411e19f6-cfd9-4175-aab7-f69fb0d43c40` | `arn:aws:backup:us-east-1:962533717758:backup-plan:411e19f6-cfd9-4175-aab7-f69fb0d43c40` |
| **backup** | W5 | Tự động sao lưu EFS, DynamoDB | `backup-vault:kicks-shoes-dev-tientp-backup-vault` | `arn:aws:backup:us-east-1:962533717758:backup-vault:kicks-shoes-dev-tientp-backup-vault` |
| **cloudfront** | W1 | CDN phân phối Frontend siêu tốc | `arn:aws:cloudfront::962533717758:distribution/E39J9WNUKFP62K` | `arn:aws:cloudfront::962533717758:distribution/E39J9WNUKFP62K` |
| **cloudwatch** | W6 | Alarms & Dashboard giám sát (MH-OBS) | `alarm:kicks-shoes-dev-tientp-ecs-cpu-high` | `arn:aws:cloudwatch:us-east-1:962533717758:alarm:kicks-shoes-dev-tientp-ecs-cpu-high` |
| **cloudwatch** | W6 | Alarms & Dashboard giám sát (MH-OBS) | `alarm:kicks-shoes-dev-tientp-bedrock-latency-high` | `arn:aws:cloudwatch:us-east-1:962533717758:alarm:kicks-shoes-dev-tientp-bedrock-latency-high` |
| **cloudwatch** | W6 | Alarms & Dashboard giám sát (MH-OBS) | `alarm:kicks-shoes-dev-tientp-lambda-errors` | `arn:aws:cloudwatch:us-east-1:962533717758:alarm:kicks-shoes-dev-tientp-lambda-errors` |
| **cognito-idp** | W2 | User Pool quản lý đăng nhập | `userpool/us-east-1_aWSNm4t2s` | `arn:aws:cognito-idp:us-east-1:962533717758:userpool/us-east-1_aWSNm4t2s` |
| **dynamodb** | W3 | NoSQL DB lưu Chat History & Main data | `table/kicks-shoes-dev-tientp-chat-messages` | `arn:aws:dynamodb:us-east-1:962533717758:table/kicks-shoes-dev-tientp-chat-messages` |
| **dynamodb** | W3 | NoSQL DB lưu Chat History & Main data | `table/kicks-shoes-dev-tientp-table` | `arn:aws:dynamodb:us-east-1:962533717758:table/kicks-shoes-dev-tientp-table` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `route-table/rtb-0e286ab602bd31c20` | `arn:aws:ec2:us-east-1:962533717758:route-table/rtb-0e286ab602bd31c20` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-0d01dbd16ee59043a` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-0d01dbd16ee59043a` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `internet-gateway/igw-00f7567369c661354` | `arn:aws:ec2:us-east-1:962533717758:internet-gateway/igw-00f7567369c661354` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-047595390c1c0939f` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-047595390c1c0939f` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-06fe14ccda3a5cb85` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-06fe14ccda3a5cb85` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-054a13361cbd1f9ec` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-054a13361cbd1f9ec` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-0c1a322246f2f893a` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-0c1a322246f2f893a` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `vpc-endpoint/vpce-0880df072f4535d9e` | `arn:aws:ec2:us-east-1:962533717758:vpc-endpoint/vpce-0880df072f4535d9e` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `vpc-flow-log/fl-0865a8f01c01bfe06` | `arn:aws:ec2:us-east-1:962533717758:vpc-flow-log/fl-0865a8f01c01bfe06` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-04fb3d7f9622b87e5` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-04fb3d7f9622b87e5` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `route-table/rtb-0b783b196e76de4f3` | `arn:aws:ec2:us-east-1:962533717758:route-table/rtb-0b783b196e76de4f3` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `route-table/rtb-0261f543b1cb9200a` | `arn:aws:ec2:us-east-1:962533717758:route-table/rtb-0261f543b1cb9200a` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-08e3d70ae6cc138d4` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-08e3d70ae6cc138d4` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-078347ce2d98a369c` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-078347ce2d98a369c` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `vpc/vpc-06f48bef6407f20be` | `arn:aws:ec2:us-east-1:962533717758:vpc/vpc-06f48bef6407f20be` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `vpc-endpoint/vpce-0fe9797cb54ebb223` | `arn:aws:ec2:us-east-1:962533717758:vpc-endpoint/vpce-0fe9797cb54ebb223` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `elastic-ip/eipalloc-0d5ea0406bd78031a` | `arn:aws:ec2:us-east-1:962533717758:elastic-ip/eipalloc-0d5ea0406bd78031a` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `natgateway/nat-023007f4f2ce2f60e` | `arn:aws:ec2:us-east-1:962533717758:natgateway/nat-023007f4f2ce2f60e` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-0e7f275c160551321` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-0e7f275c160551321` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-04732952b1c00bb61` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-04732952b1c00bb61` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-063f71b55077a7ffd` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-063f71b55077a7ffd` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-0f9dbcfbbee4985e7` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-0f9dbcfbbee4985e7` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `route-table/rtb-0968c5558da746017` | `arn:aws:ec2:us-east-1:962533717758:route-table/rtb-0968c5558da746017` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `route-table/rtb-0f72dbeeac0a57ae2` | `arn:aws:ec2:us-east-1:962533717758:route-table/rtb-0f72dbeeac0a57ae2` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-0866ed4a39e549437` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-0866ed4a39e549437` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `subnet/subnet-0465d638b6a106e58` | `arn:aws:ec2:us-east-1:962533717758:subnet/subnet-0465d638b6a106e58` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `network-acl/acl-0c9d03471773b9a51` | `arn:aws:ec2:us-east-1:962533717758:network-acl/acl-0c9d03471773b9a51` |
| **ec2** | W1 | Hạ tầng mạng cốt lõi (VPC, Subnet, NAT, SG) | `security-group/sg-05db49b1794aa8dd4` | `arn:aws:ec2:us-east-1:962533717758:security-group/sg-05db49b1794aa8dd4` |
| **ecs** | W1 | Container chạy Backend App | `service/kicks-shoes-dev-tientp-cluster/kicks-shoes-dev-tientp-service` | `arn:aws:ecs:us-east-1:962533717758:service/kicks-shoes-dev-tientp-cluster/kicks-shoes-dev-tientp-service` |
| **ecs** | W1 | Container chạy Backend App | `task-definition/kicks-shoes-dev-tientp-service:2` | `arn:aws:ecs:us-east-1:962533717758:task-definition/kicks-shoes-dev-tientp-service:2` |
| **ecs** | W1 | Container chạy Backend App | `cluster/kicks-shoes-dev-tientp-cluster` | `arn:aws:ecs:us-east-1:962533717758:cluster/kicks-shoes-dev-tientp-cluster` |
| **ecs** | W1 | Container chạy Backend App | `task-definition/kicks-shoes-dev-tientp-service:1` | `arn:aws:ecs:us-east-1:962533717758:task-definition/kicks-shoes-dev-tientp-service:1` |
| **elasticache** | W4 | Redis Cache tăng tốc truy xuất | `subnetgroup:kicks-shoes-dev-tientp-redis-subnet-group` | `arn:aws:elasticache:us-east-1:962533717758:subnetgroup:kicks-shoes-dev-tientp-redis-subnet-group` |
| **elasticache** | W4 | Redis Cache tăng tốc truy xuất | `cluster:kicks-shoes-dev-tientp-redis` | `arn:aws:elasticache:us-east-1:962533717758:cluster:kicks-shoes-dev-tientp-redis` |
| **elasticfilesystem** | W5 | Shared Storage Mount cho ECS | `file-system/fs-0fc910bea569d5243` | `arn:aws:elasticfilesystem:us-east-1:962533717758:file-system/fs-0fc910bea569d5243` |
| **elasticfilesystem** | W5 | Shared Storage Mount cho ECS | `access-point/fsap-0e383b23476bf7371` | `arn:aws:elasticfilesystem:us-east-1:962533717758:access-point/fsap-0e383b23476bf7371` |
| **elasticloadbalancing** | W1 | Application Load Balancer (ALB) | `loadbalancer/app/kicks-shoes-dev-tientp-alb/2c76dfd45b6ff696` | `arn:aws:elasticloadbalancing:us-east-1:962533717758:loadbalancer/app/kicks-shoes-dev-tientp-alb/2c76dfd45b6ff696` |
| **elasticloadbalancing** | W1 | Application Load Balancer (ALB) | `targetgroup/kicks-shoes-dev-tientp-tg/13effea63666b141` | `arn:aws:elasticloadbalancing:us-east-1:962533717758:targetgroup/kicks-shoes-dev-tientp-tg/13effea63666b141` |
| **elasticloadbalancing** | W1 | Application Load Balancer (ALB) | `listener/app/kicks-shoes-dev-tientp-alb/2c76dfd45b6ff696/2ab8676b05ec0de5` | `arn:aws:elasticloadbalancing:us-east-1:962533717758:listener/app/kicks-shoes-dev-tientp-alb/2c76dfd45b6ff696/2ab8676b05ec0de5` |
| **events** | W6 | EventBridge kích hoạt Lambda định kỳ | `rule/kicks-shoes-dev-tientp-s3-public-access-guard` | `arn:aws:events:us-east-1:962533717758:rule/kicks-shoes-dev-tientp-s3-public-access-guard` |
| **iam** | W1/W2 | Phân quyền (Least-Privilege Roles) | `arn:aws:iam::962533717758:policy/kicks-shoes-dev-tientp-ecs-efs-policy` | `arn:aws:iam::962533717758:policy/kicks-shoes-dev-tientp-ecs-efs-policy` |
| **iam** | W1/W2 | Phân quyền (Least-Privilege Roles) | `arn:aws:iam::962533717758:policy/kicks-shoes-dev-tientp-service-20260520110736282000000013` | `arn:aws:iam::962533717758:policy/kicks-shoes-dev-tientp-service-20260520110736282000000013` |
| **kms** | W6 | Customer Managed Key mã hóa S3 | `key/d7d5163f-8722-4d7e-9db4-144a24373ef1` | `arn:aws:kms:us-east-1:962533717758:key/d7d5163f-8722-4d7e-9db4-144a24373ef1` |
| **lambda** | W5 | Xác thực JWT Token | `function:kicks-shoes-dev-tientp-jwt-authorizer` | `arn:aws:lambda:us-east-1:962533717758:function:kicks-shoes-dev-tientp-jwt-authorizer` |
| **lambda** | W6 | Tự động hóa quản trị Cost/Sec | `function:kicks-shoes-dev-tientp-cost-guard` | `arn:aws:lambda:us-east-1:962533717758:function:kicks-shoes-dev-tientp-cost-guard` |
| **lambda** | W6 | Tự động hóa quản trị Cost/Sec | `function:kicks-shoes-dev-tientp-security-guard` | `arn:aws:lambda:us-east-1:962533717758:function:kicks-shoes-dev-tientp-security-guard` |
| **lambda** | W3 | Xử lý logic Chat AI Bedrock | `function:kicks-shoes-dev-tientp-bedrock-chat` | `arn:aws:lambda:us-east-1:962533717758:function:kicks-shoes-dev-tientp-bedrock-chat` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/network-firewall/alert/kicks-shoes-dev-tientp` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/network-firewall/alert/kicks-shoes-dev-tientp` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/apigateway/kicks-shoes-dev-tientp-bedrock-api` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/apigateway/kicks-shoes-dev-tientp-bedrock-api` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/ecs/kicks-shoes-dev-tientp-service/app` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/ecs/kicks-shoes-dev-tientp-service/app` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/ecs/kicks-shoes-dev-tientp` | `arn:aws:logs:us-east-1:962533717758:log-group:/ecs/kicks-shoes-dev-tientp` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/lambda/kicks-shoes-dev-tientp-cost-guard` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/lambda/kicks-shoes-dev-tientp-cost-guard` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/lambda/kicks-shoes-dev-tientp-security-guard` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/lambda/kicks-shoes-dev-tientp-security-guard` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/ecs/kicks-shoes-dev-tientp-cluster` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/ecs/kicks-shoes-dev-tientp-cluster` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/vpc/kicks-shoes-dev-tientp/flow-logs` | `arn:aws:logs:us-east-1:962533717758:log-group:/vpc/kicks-shoes-dev-tientp/flow-logs` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/elasticache/kicks-shoes-dev-tientp-redis` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/elasticache/kicks-shoes-dev-tientp-redis` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/lambda/kicks-shoes-dev-tientp-bedrock-chat` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/lambda/kicks-shoes-dev-tientp-bedrock-chat` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/network-firewall/flow/kicks-shoes-dev-tientp` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/network-firewall/flow/kicks-shoes-dev-tientp` |
| **logs** | W5/W6 | Lưu trữ log (VPC Flow, Lambda, API GW) | `log-group:/aws/lambda/kicks-shoes-dev-tientp-jwt-authorizer` | `arn:aws:logs:us-east-1:962533717758:log-group:/aws/lambda/kicks-shoes-dev-tientp-jwt-authorizer` |
| **network-firewall** | W5 | Lọc Outbound traffic (Domain allowlist) | `stateful-rulegroup/kicks-shoes-dev-tientp-domain-allowlist` | `arn:aws:network-firewall:us-east-1:962533717758:stateful-rulegroup/kicks-shoes-dev-tientp-domain-allowlist` |
| **network-firewall** | W5 | Lọc Outbound traffic (Domain allowlist) | `firewall/kicks-shoes-dev-tientp-firewall` | `arn:aws:network-firewall:us-east-1:962533717758:firewall/kicks-shoes-dev-tientp-firewall` |
| **network-firewall** | W5 | Lọc Outbound traffic (Domain allowlist) | `firewall-policy/kicks-shoes-dev-tientp-firewall-policy` | `arn:aws:network-firewall:us-east-1:962533717758:firewall-policy/kicks-shoes-dev-tientp-firewall-policy` |
| **rds** | W3 | Cơ sở dữ liệu quan hệ | `subgrp:kicks-shoes-dev-tientp-vpc` | `arn:aws:rds:us-east-1:962533717758:subgrp:kicks-shoes-dev-tientp-vpc` |
| **s3** | W2 | Lưu trữ File Upload & Front-end Assets | `arn:aws:s3:::kicks-shoes-dev-tientp-962533717758-uploads` | `arn:aws:s3:::kicks-shoes-dev-tientp-962533717758-uploads` |
| **sns** | W6 | Nhận & Gửi thông báo Budgets/Alarms | `kicks-shoes-dev-tientp-alerts` | `arn:aws:sns:us-east-1:962533717758:kicks-shoes-dev-tientp-alerts` |
| **sqs** | W5 | Dead-Letter Queue cô lập tin nhắn lỗi | `kicks-shoes-dev-tientp-bedrock-dlq` | `arn:aws:sqs:us-east-1:962533717758:kicks-shoes-dev-tientp-bedrock-dlq` |

