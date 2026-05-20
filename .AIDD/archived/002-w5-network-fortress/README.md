# 002 — W5: The Network Fortress

## Summary

Hardening toàn diện hạ tầng AWS cho Kicks Shoes trên account mới: Multi-VPC connectivity, Network Firewall, EFS file storage + AWS Backup, API Gateway trước Lambda Bedrock, và Serverless Scaling Pattern. Deadline: Thứ Sáu 15-05-2026.

---

## Goals

| # | Goal | Success Metric |
|---|------|----------------|
| 1 | App chạy end-to-end trên AWS account mới | `GET /api/health → 200`, demo 1-2 action thật |
| 2 | Network quan sát được qua VPC Flow Logs | Sample log entry trong Evidence Pack |
| 3 | Traffic egress đi qua Network Firewall trước NAT GW | 1 request allowed + 1 blocked trong logs |
| 4 | EFS mount vào ECS Fargate, phục vụ nội dung thật | File ghi/đọc từ private subnet |
| 5 | AWS Backup bao trùm EFS + DynamoDB + EBS, restore test pass | Restore job Completed + data đọc được |
| 6 | API Gateway trước Lambda Bedrock với auth + throttling | curl 200 (auth) + curl 403 (no auth) |
| 7 | Lambda scaling pattern apply lên function thật | CloudWatch evidence theo pattern chọn |
| 8 | `docs/W5_evidence.md` đầy đủ, commit vào repo | File tồn tại, có đủ 8 mục |

---

## Decisions

| Question | Decision | Reason |
|----------|----------|--------|
| MH1 path | **Path C — Justified Single-VPC** | Kicks Shoes là single-tenant e-commerce, không có business case tách VPC. Tất cả tầng (ALB, ECS, DynamoDB, Lambda) đều trong 1 VPC `10.0.0.0/16`. Trigger thêm VPC: nếu thêm môi trường staging độc lập hoặc tích hợp partner network. |
| MH2 path | **Path A — AWS Network Firewall** | ECS Fargate ra internet qua NAT GW (pull Docker image từ ECR public, gọi Gemini API, gọi external weather API). Bắt buộc theo đề bài. |
| MH3 file storage | **Amazon EFS** | Đơn giản hơn FSx, native với ECS Fargate, phù hợp use case: shared CV/product image cache, session files. |
| MH4 Lambda target | **Lambda `bedrock-chat`** | Function thật trong app, xử lý AI chat query qua Bedrock Knowledge Base. Đặt API Gateway HTTP API trước nó. |
| MH5 scaling pattern | **Async Invocation + DLQ** | `bedrock-chat` Lambda đã được trigger bởi DynamoDB Streams (async). Thêm DLQ (SQS) để catch failed invocations — phù hợp nhất với architecture hiện tại, không cần thay đổi trigger. |
| API Gateway type | HTTP API | Rẻ hơn REST API, đủ tính năng cho Lambda Proxy + JWT Authorizer. |
| Auth method | Lambda Authorizer (JWT) | App đã có JWT auth, tái dụng logic. Không cần Cognito thêm. |
| EFS access | ECS task mount via EFS Access Point | Isolate per-app directory, không mount root. |
| Backup vault | Mới tạo `kicks-shoes-backup-vault` | Tách biệt với default vault để dễ quản lý. |

---

## Acceptance Criteria

### Carry-Forward (bắt buộc trước khi làm W5)
- [ ] ECS Fargate service RUNNING, `GET /api/health → 200`
- [ ] ALB DNS resolve được, CloudFront distribution active
- [ ] Architecture diagram cập nhật khớp với console AWS
- [ ] Nêu 1 feedback W4 và cách W5 fix

### MH1 — Single-VPC + Flow Logs
- [ ] VPC Flow Logs bật trên VPC `kicks-shoes-dev-vpc`, publish về CloudWatch Logs group `/vpc/kicks-shoes-dev/flow-logs`
- [ ] Justification Single-VPC viết trong Evidence Pack (không phải câu chữ chung chung)
- [ ] Tất cả subnet tiers đã multi-AZ (public ×2, private ×2, db ×2) — đã có từ W1
- [ ] Sample Flow Log entry trong Evidence Pack (ACCEPT + REJECT)
- [ ] Trigger thêm VPC thứ hai được document

### MH2 — Network Firewall
- [ ] Firewall subnet riêng: `10.0.30.0/24` (AZ-a), `10.0.31.0/24` (AZ-b)
- [ ] AWS Network Firewall endpoint deployed trong firewall subnets
- [ ] Stateful rule group: domain-based egress allowlist (chỉ allow các domain cần thiết)
- [ ] Alert Logs bật, publish về CloudWatch `/aws/network-firewall/alert/kicks-shoes-dev`
- [ ] Route table private subnets: `0.0.0.0/0 → Firewall endpoint` (thay vì thẳng NAT GW)
- [ ] Route table firewall subnets: `0.0.0.0/0 → NAT GW`
- [ ] 1 request allowed trong Flow Logs (ví dụ: ECS gọi ECR)
- [ ] 1 request blocked trong Alert Logs (ví dụ: curl domain không trong allowlist)

### MH3 — EFS + AWS Backup
- [ ] EFS file system `kicks-shoes-dev-efs` tạo trong VPC
- [ ] Mount target trong mỗi private subnet (AZ-a, AZ-b)
- [ ] SG mount target chỉ allow NFS (2049) từ SG ECS task
- [ ] ECS task definition mount EFS volume vào `/mnt/efs`
- [ ] Test: ghi file từ ECS task, đọc lại được từ cùng path
- [ ] AWS Backup plan `kicks-shoes-daily-backup` với schedule daily, retention 7 ngày
- [ ] Backup vault `kicks-shoes-backup-vault`
- [ ] Backup plan bao trùm: EFS + DynamoDB table + (EBS nếu có EC2)
- [ ] Restore job triggered từ recovery point → status Completed
- [ ] Data đọc được từ resource đã restore

### MH4 — API Gateway
- [ ] HTTP API `kicks-shoes-bedrock-api` tạo trên API Gateway
- [ ] Route `POST /chat` → Lambda Proxy Integration → `bedrock-chat` Lambda
- [ ] Lambda Authorizer cấu hình (validate JWT từ app)
- [ ] Usage plan: rate 10 req/s, burst 20
- [ ] App code cập nhật: gọi API Gateway URL thay vì invoke Lambda trực tiếp
- [ ] `curl -H "Authorization: Bearer <token>" POST /chat → 200`
- [ ] `curl POST /chat` (no auth) `→ 403`

### MH5 — Async Lambda + DLQ
- [ ] SQS queue `kicks-shoes-bedrock-dlq` tạo
- [ ] Lambda `bedrock-chat` cấu hình DLQ → SQS queue trên
- [ ] Retry: `MaximumRetryAttempts = 2`
- [ ] Demo: trigger invocation thất bại (mock error hoặc invalid payload)
- [ ] Message xuất hiện trong DLQ với error details
- [ ] Screenshot DLQ message trong Evidence Pack

### Evidence Pack
- [ ] `docs/W5_evidence.md` tồn tại và có đủ 8 mục theo spec
- [ ] Slide Thứ Sáu link về `docs/W5_evidence.md`

---

## Detail Files

- [01-carry-forward.md](./01-carry-forward.md) — Deploy lại app, checklist carry-forward, architecture diagram update
- [02-mh1-vpc-flowlogs.md](./02-mh1-vpc-flowlogs.md) — Single-VPC justification, Flow Logs Terraform config
- [03-mh2-network-firewall.md](./03-mh2-network-firewall.md) — Network Firewall subnet, rule group, route table changes
- [04-mh3-efs-backup.md](./04-mh3-efs-backup.md) — EFS setup, ECS mount, AWS Backup plan + restore test
- [05-mh4-api-gateway.md](./05-mh4-api-gateway.md) — HTTP API, Lambda Authorizer, throttling, app code update
- [06-mh5-async-dlq.md](./06-mh5-async-dlq.md) — DLQ config, retry policy, demo failure flow
- [07-evidence-pack.md](./07-evidence-pack.md) — Template `docs/W5_evidence.md` đầy đủ
