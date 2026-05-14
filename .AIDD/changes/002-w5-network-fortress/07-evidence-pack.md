# 07 — Evidence Pack Template: docs/W5_evidence.md

File này là template đầy đủ cho `docs/W5_evidence.md`. Copy và điền vào trong quá trình làm.

---

## Template

```markdown
# W5 Evidence Pack — Kicks Shoes

**Group:** Group 13  
**Members:** [Điền tên thành viên]  
**Repo:** https://github.com/KickLabs/Kicks-Shoes  
**W4 Evidence Pack:** [link tới docs/W4_evidence.md hoặc tuần trước]  
**Date:** 15-05-2026

---

## 1. Cover

| Item | Value |
|------|-------|
| AWS Account ID | [account-id] |
| Region | ap-southeast-1 |
| VPC ID | vpc-xxxxxxxx |
| ECS Cluster | kicks-shoes-dev-cluster |
| App URL | https://dev.[domain] |

---

## 2. Application Carry-Forward Verification

**App running end-to-end:**

[Screenshot: ECS service RUNNING, desired=1, running=1]

**Action 1 — Product listing:**
```
GET https://api.dev.[domain]/api/v1/products
→ 200 OK, returns product array
```
[Screenshot: curl hoặc browser response]

**Action 2 — AI Chat:**
```
POST https://api.dev.[domain]/api/v1/chat
→ 200 OK, Bedrock response
```
[Screenshot: chat response]

**Architecture diagram:**
[Diagram ảnh hoặc link]

**Feedback W4 → W5 fix:**
- Feedback: "[feedback cụ thể từ trainer]"
- Fix: "[cách W5 giải quyết]"

---

## 3. MH1 — Multi-VPC Connectivity

**Path chọn:** Path C — Justified Single-VPC

**Justification:**
Kicks Shoes là single-tenant e-commerce platform. Tất cả components phục vụ cùng business domain, cùng operator team. Không có compliance requirement (PCI-DSS, HIPAA) đòi network segmentation cứng. Subnet-level isolation (public/private/db/firewall) đủ để enforce least-privilege access.

**Trigger thêm VPC thứ hai:**
1. Thêm môi trường staging cần network isolation hoàn toàn
2. Tích hợp partner API cần dedicated peering
3. Tách batch processing pipeline khỏi serving layer

**Subnet architecture (multi-AZ):**
| Tier | AZ-a | AZ-b |
|------|------|------|
| Public | 10.0.0.0/24 | 10.0.1.0/24 |
| Private (ECS) | 10.0.10.0/24 | 10.0.11.0/24 |
| DB (ElastiCache) | 10.0.20.0/24 | 10.0.21.0/24 |
| Firewall | 10.0.30.0/24 | 10.0.31.0/24 |

**VPC Flow Logs:**
- Log group: `/vpc/kicks-shoes-dev/flow-logs`
- Traffic type: ALL (ACCEPT + REJECT)

[Screenshot: VPC Flow Logs enabled — console]
[Screenshot: CloudWatch log group với entries]

**Sample ACCEPT entry:**
```
2 [account] eni-xxx 10.0.10.5 52.94.76.1 443 54321 6 10 840 [start] [end] ACCEPT OK
```

**Sample REJECT entry:**
```
2 [account] eni-xxx 10.0.10.5 1.2.3.4 80 12345 6 1 40 [start] [end] REJECT OK
```

[Screenshot: ACCEPT log entry]
[Screenshot: REJECT log entry]

---

## 4. MH2 — Network Firewall Hardening

**Path chọn:** Path A — AWS Network Firewall

**Rationale:** ECS Fargate ra internet qua NAT GW để pull Docker images, gọi Gemini API, gọi Weather API. Bắt buộc deploy Network Firewall.

**Traffic flow:**
```
ECS (private) → Firewall Endpoint → NAT GW → IGW → Internet
```

**Firewall config:**
- Firewall: kicks-shoes-dev-firewall
- Policy: domain-based egress allowlist
- Allowed domains: *.amazonaws.com, *.docker.io, generativelanguage.googleapis.com, api.openweathermap.org, *.mongodb.net
- Alert Logs: /aws/network-firewall/alert/kicks-shoes-dev

[Screenshot: Network Firewall console — status READY]
[Screenshot: Stateful rule group — domain allowlist]
[Screenshot: Route table private subnet — 0.0.0.0/0 → vpce-xxx (firewall endpoint)]

**Allowed request (Flow Logs):**
```
ECS task → generativelanguage.googleapis.com:443 → ACCEPT
```
[Screenshot: Flow Log ACCEPT entry cho googleapis.com]

**Blocked request (Alert Logs):**
```
ECS task → example.com:80 → REJECT
```
[Screenshot: Alert Log REJECT entry cho example.com]

---

## 5. MH3 — File Storage + Backup Plan

**EFS:**
- File system: fs-xxxxxxxx (kicks-shoes-dev-efs)
- Mount path: /mnt/efs trong ECS container
- Use case: shared product image uploads, AI description cache
- SG: chỉ allow NFS 2049 từ ECS SG

[Screenshot: EFS console — AVAILABLE]
[Screenshot: Mount targets — 2 AZ, lifecycle state AVAILABLE]
[Screenshot: ECS task definition — EFS volume mount]

**EFS write/read test:**
```bash
# Trong ECS container
echo "W5 EFS test - 2026-05-13" > /mnt/efs/test.txt
cat /mnt/efs/test.txt
# Output: W5 EFS test - 2026-05-13
```
[Screenshot: ECS Exec output — file ghi và đọc thành công]

**AWS Backup:**
- Vault: kicks-shoes-dev-backup-vault
- Plan: kicks-shoes-daily-backup
- Schedule: daily 2AM UTC
- Retention: 7 ngày
- Resources: EFS (fs-xxxxxxxx) + DynamoDB (kicks-shoes-dev-table)

[Screenshot: Backup plan console]
[Screenshot: Backup vault với recovery points]
[Screenshot: Backup job status = COMPLETED]

**Restore test:**
- Restore job ID: [job-id]
- Status: COMPLETED
- Resource restored: EFS (new file system)

[Screenshot: Restore job COMPLETED]
[Screenshot: Data đọc được từ restored EFS — cat /mnt/efs/test.txt]

---

## 6. MH4 — API Gateway trước Lambda

**API:** kicks-shoes-bedrock-api (HTTP API)
**Endpoint:** https://[api-id].execute-api.ap-southeast-1.amazonaws.com
**Route:** POST /chat → Lambda bedrock-chat
**Auth:** Lambda Authorizer (JWT)
**Throttling:** 10 req/s rate, 20 burst

[Screenshot: API Gateway console — routes]
[Screenshot: Lambda Authorizer config]
[Screenshot: Throttling settings]

**Test authenticated (200):**
```bash
curl -X POST https://[api-id].execute-api.ap-southeast-1.amazonaws.com/chat \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"message":"What shoes do you recommend?"}' \
  -w "\nHTTP Status: %{http_code}"
```
Output:
```json
{"response":"Based on our collection, I recommend..."}
HTTP Status: 200
```
[Screenshot: curl 200 response]

**Test no auth (403):**
```bash
curl -X POST https://[api-id].execute-api.ap-southeast-1.amazonaws.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  -w "\nHTTP Status: %{http_code}"
```
Output:
```
{"message":"Forbidden"}
HTTP Status: 403
```
[Screenshot: curl 403 response]

---

## 7. MH5 — Serverless Scaling Pattern

**Pattern:** Async Invocation + Dead Letter Queue

**Lambda:** kicks-shoes-dev-bedrock-chat
**Trigger:** DynamoDB Streams (async)
**DLQ:** SQS kicks-shoes-dev-bedrock-dlq
**Retry:** MaximumRetryAttempts = 2

[Screenshot: Lambda configuration — DLQ = kicks-shoes-dev-bedrock-dlq]
[Screenshot: Event source mapping — MaximumRetryAttempts = 2]

**Demo failure flow:**
1. Set BEDROCK_KB_ID = invalid
2. Insert message vào DynamoDB → trigger Lambda
3. Lambda fails → retry 2 lần → message vào DLQ

[Screenshot: SQS DLQ — NumberOfMessagesSent > 0]
[Screenshot: DLQ message body với error details]
[Screenshot: CloudWatch Lambda Errors metric]

---

## 8. Negative Security Tests

### Test 1 — API Gateway no auth → 403
```bash
curl -X POST https://[api-id].execute-api.../chat -d '{"message":"test"}'
→ 403 Forbidden
```
[Screenshot: 403 response]

### Test 2 — Network Firewall block non-allowlisted domain
```bash
# Từ ECS container
curl -I https://example.com
→ Connection timeout (blocked by firewall)
```
[Screenshot: Alert Log entry — REJECT]

### Test 3 — EFS SG — direct access từ ngoài ECS bị từ chối
```bash
# Từ EC2 không có trong ECS SG
mount -t nfs4 [efs-dns]:/ /mnt/test
→ Connection timed out (SG block)
```
[Screenshot: mount command timeout]

### Test 4 — VPC Flow Logs — REJECT entry
[Screenshot: Flow Log REJECT entry]
```
