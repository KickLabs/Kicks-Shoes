# 003 — W6: Operations Hardening & Cost-Aware Cloud

> Deadline: Thứ Sáu 22-05-2026 | Budget cap: **$150 tuyệt đối**

---

## Tổng quan

W6 không thêm tính năng mới. W6 lấy stack Kicks Shoes đã build từ W1–W5 và chứng minh rằng nó có thể **vận hành được** — biết chi phí, kiểm soát chi phí, quan sát được, và tự sửa lỗi bảo mật.

**Nguyên tắc cốt lõi: Demonstrable, not documented.**

---

## Kiến trúc hiện tại (W5 carry-forward)

```
Internet
  │
  ▼
CloudFront (WAF) ──→ Backend ALB CloudFront (HTTPS proxy)
  │
  ▼
ALB (HTTP/HTTPS)
  │
  ▼
ECS Fargate (private subnet)  ← task_cpu=256, task_memory=512
  │   ├── EFS mount /mnt/efs  (W5 MH3)
  │   └── SG: chỉ từ ALB
  │
  ├──→ [Firewall Endpoint] ──→ NAT GW ──→ Internet  (W5 MH2)
  │
  ├──→ DynamoDB (chat messages + main table)
  │       └── Stream ──→ Lambda bedrock-chat
  │                         ↑
  │                    API Gateway HTTP API  (W5 MH4)
  │                    (JWT Authorizer, 10 req/s throttle)
  │                         │
  │                    DLQ (SQS)  (W5 MH5)
  │
  ├──→ MongoDB Atlas (external)
  ├──→ S3 (uploads, Block Public Access ON, AES256)
  ├──→ ElastiCache Redis (cache.t3.micro)
  └──→ Secrets Manager (JWT, MongoDB URI, API keys)

VPC Flow Logs ──→ CloudWatch  (W5 MH1)
Network Firewall Alert Logs ──→ CloudWatch  (W5 MH2)
AWS Backup Vault ──→ EFS + DynamoDB  (W5 MH3)
```

---

## Những gì đã có sẵn (KHÔNG cần làm lại)

| Resource | Trạng thái | Ghi chú |
|----------|-----------|---------|
| ECS Fargate + ALB | ✅ Deployed | `task_cpu=256, task_memory=512` |
| CloudFront (2 distributions) | ✅ Deployed | WAF + backend HTTPS proxy |
| Network Firewall | ✅ Deployed | Domain allowlist egress |
| VPC Flow Logs | ✅ Deployed | `/vpc/kicks-shoes-dev/flow-logs` |
| EFS + AWS Backup | ✅ Deployed | Daily backup, 7-day retention |
| API Gateway HTTP API | ✅ Deployed | JWT Authorizer, throttling |
| Lambda bedrock-chat + DLQ | ✅ Deployed | DynamoDB Streams trigger |
| S3 uploads bucket | ✅ Deployed | Block Public Access ON, AES256 |
| DynamoDB (2 tables) | ✅ Deployed | PAY_PER_REQUEST, PITR ON |
| ElastiCache Redis | ✅ Deployed | cache.t3.micro |
| Secrets Manager | ✅ Deployed | JWT, MongoDB URI, API keys |
| SNS alerts topic | ✅ Deployed | `kicks-shoes-dev-alerts` |
| CloudWatch alarm (ECS CPU) | ✅ Deployed | Threshold 80%, → SNS |
| Cognito User Pool | ✅ Deployed | (optional, not core) |

---

## 4 Must-Haves W6 cần build

### MH-COST-V — Cost Visibility & Attribution

**Vấn đề hiện tại:**
- Tags trong `common_tags` chỉ có `Project`, `Environment`, `ManagedBy` — **thiếu `Owner`, `CostCenter`, `Application`**
- Cost allocation tags **chưa được activate** trong Billing console
- Không có Cost Explorer filter, không có Budgets, không có Cost Anomaly Detection

**Cần làm:**

1. **Thêm 4 tag keys bắt buộc** vào tất cả resources:
   ```hcl
   # Trong variables.tf — thêm vào default tags
   Owner       = "team-lead@email.com"
   CostCenter  = "G13"          # group ID
   Application = "KicksShoes"
   Environment = "dev"          # đã có
   ```

2. **Activate cost allocation tags** trong AWS Billing console:
   - Billing → Cost allocation tags → tìm `Owner`, `Application` → Activate
   - ⚠️ Bước này KHÔNG làm được bằng Terraform — phải làm thủ công trên console

3. **Cấu hình ít nhất 1 cost tool** (khuyến nghị 2):
   - AWS Budgets: daily budget $150 → SNS (cần cho MH-COST-A)
   - Cost Anomaly Detection: monitor scoped to `Application=KicksShoes`

4. **Chụp baseline cost breakdown** sau 24h redeployment

**Terraform changes cần:**
- `infra/terraform/environments/dev/02-app/variables.tf` — thêm `Owner`, `CostCenter`, `Application` vào `tags` default
- `infra/terraform/environments/dev/01-network/main.tf` — đảm bảo tags nhất quán
- Tạo `infra/terraform/environments/dev/02-app/budgets.tf` — AWS Budgets + SNS

---

### MH-COST-A — Cost Control & Action

**Vấn đề hiện tại:**
- Không có Lambda nào stop/terminate resources
- Không có EventBridge schedule
- SNS topic `kicks-shoes-dev-alerts` đã có nhưng chưa wire vào cost guard

**Cần làm:**

1. **Lambda cost-guard** — stop EC2/RDS không tagged `keep=true` (hoặc tất cả `Environment=dev`):
   ```python
   # Least-privilege role: chỉ ec2:StopInstances + rds:StopDBInstance
   # Logic: describe instances → filter by tag → stop
   ```

2. **EventBridge Scheduler** — daily cron 20:00 UTC invoke Lambda

3. **Demo chain**: có ít nhất 1 EC2/RDS instance bị stop bởi Lambda, CloudTrail `StopInstances` evidence

4. **Wire Budgets $150 → SNS → Lambda**:
   - Budgets daily $150 → SNS topic → Lambda cost-guard
   - Test bằng cách publish test message lên SNS
   - Viết ADR về cost-data latency (~8–24h)

**Terraform files cần tạo:**
- `infra/terraform/environments/dev/02-app/cost-guard.tf` — Lambda + EventBridge + IAM role
- `infra/terraform/environments/dev/02-app/budgets.tf` — AWS Budgets + SNS subscription

---

### MH-OBS — Monitoring

**Vấn đề hiện tại:**
- CloudWatch alarm `ecs-cpu-high` đã có nhưng có thể ở trạng thái `INSUFFICIENT_DATA` (chưa có data points)
- **Không có custom metric** từ application layer
- **Không có CloudWatch dashboard**
- **Không có Log Insights saved query**
- API Gateway access log format quá đơn giản (`$context.requestId` only)

**Cần làm:**

1. **Custom metric** — publish từ Lambda bedrock-chat hoặc ECS app:
   ```javascript
   // Trong Lambda bedrock-chat/index.js
   await cloudwatch.putMetricData({
     Namespace: 'KicksShoes/Operations',
     MetricData: [{
       MetricName: 'BedrockQueryLatencyMs',
       Value: latencyMs,
       Unit: 'Milliseconds'
     }]
   }).promise();
   ```

2. **CloudWatch Dashboard** với 3 widget types:
   - Custom: `BedrockQueryLatencyMs` (từ Lambda)
   - Standard: ECS `CPUUtilization`
   - Standard: Lambda `Errors` hoặc API Gateway `4XXError`

3. **Alarm trong OK/ALARM state** (không phải INSUFFICIENT_DATA):
   - Trigger Lambda với bad input 6 lần trước Friday để có data
   - Hoặc tạo alarm mới trên metric đã có data (ECS CPU)

4. **Log Insights saved query** — chạy trên log group thật:
   ```
   # API Gateway logs — top slowest requests
   fields @timestamp, @message
   | filter @message like /POST/
   | stats count(*) as request_count by bin(5m)
   | sort @timestamp desc
   ```
   Hoặc trên Lambda logs:
   ```
   fields @timestamp, @message
   | filter @message like /ERROR/
   | stats count(*) as error_count by bin(5m)
   | sort @timestamp desc
   ```

5. **Fix API Gateway access log format** — thêm nhiều fields hơn:
   ```json
   {
     "requestId": "$context.requestId",
     "ip": "$context.identity.sourceIp",
     "requestTime": "$context.requestTime",
     "httpMethod": "$context.httpMethod",
     "routeKey": "$context.routeKey",
     "status": "$context.status",
     "responseLatency": "$context.responseLatency",
     "integrationLatency": "$context.integrationLatency"
   }
   ```

**Terraform files cần sửa:**
- `infra/terraform/environments/dev/02-app/api-gateway.tf` — fix access log format
- `infra/terraform/environments/dev/02-app/monitoring.tf` — tạo mới: dashboard + alarms + metric filter

---

### MH-SEC — Self-Healing Security Guard

**Vấn đề hiện tại:**
- Không có detect→auto-fix loop
- S3 bucket đã có Block Public Access ON — tốt, nhưng không có automation để re-enforce nếu bị thay đổi
- Không có KMS CMK (đang dùng AES256 managed key)

**Cần làm:**

**Detect→Fix Loop (chọn 1 trong 2):**

**Option A — S3 Public Access Guard (khuyến nghị — phù hợp nhất với stack):**
- Lambda detect S3 bucket `kicks-shoes-*-uploads` bị make public
- Gọi `PutPublicAccessBlock` để re-enable Block Public Access
- Trigger: EventBridge rule on CloudTrail event `PutBucketPolicy` / `PutBucketAcl`
- Demo: tắt Block Public Access → Lambda fix → CloudTrail `PutPublicAccessBlock`

**Option B — Security Group SSH Guard:**
- Lambda detect SG ingress `0.0.0.0/0` port 22
- Gọi `RevokeSecurityGroupIngress`
- Trigger: EventBridge rule on CloudTrail `AuthorizeSecurityGroupIngress`

**Supporting Preventive Control (chọn 1):**

**Path A — KMS CMK (khuyến nghị):**
- Tạo KMS CMK `alias/kicks-shoes-dev-s3`
- Apply vào S3 uploads bucket (thay AES256 → aws:kms với CMK)
- Verify CloudTrail `kms:GenerateDataKey` từ `s3.amazonaws.com`
- Cost: $1/month — justified vì audit trail cho upload data

**Path B — Account-level S3 Block Public Access + deny policy:**
- Enable account-level BPA (4 settings ON)
- Add bucket policy deny non-TLS PutObject
- Demo denied test call

**Terraform files cần tạo:**
- `infra/terraform/environments/dev/02-app/security-guard.tf` — Lambda + EventBridge + IAM
- `infra/terraform/environments/dev/02-app/kms.tf` — KMS CMK (nếu chọn Path A)

---

## Checklist tổng hợp

### Trước khi làm W6 (Monday)
- [ ] Redeploy stack trên account mới
- [ ] Verify `GET /api/health → 200`
- [ ] Verify ECS service RUNNING

### MH-COST-V
- [ ] Thêm `Owner`, `CostCenter`, `Application` tags vào tất cả resources
- [ ] Apply `terraform apply` để update tags
- [ ] Activate cost allocation tags trong Billing console (thủ công)
- [ ] Cấu hình AWS Budgets daily $150
- [ ] Cấu hình Cost Anomaly Detection (optional nhưng nên có)
- [ ] Chụp Cost Explorer screenshot sau 24h
- [ ] Viết 1-paragraph observation về top 3 cost drivers
- [ ] Viết tagging strategy document (1 page)

### MH-COST-A
- [ ] Tạo Lambda cost-guard (Python/Node, least-privilege IAM)
- [ ] Tạo EventBridge Scheduler daily cron 20:00 UTC
- [ ] Deploy EC2 test instance (không tag `keep=true`)
- [ ] Chạy Lambda → verify EC2 stopped → chụp CloudTrail `StopInstances`
- [ ] Wire Budgets $150 → SNS → Lambda
- [ ] Test SNS publish → Lambda stop resource
- [ ] Viết ADR về cost-data latency

### MH-OBS
- [ ] Thêm `PutMetricData` vào Lambda bedrock-chat (custom metric)
- [ ] Invoke Lambda vài lần để có data points
- [ ] Tạo CloudWatch Dashboard (3 widgets: 1 custom + 2 standard)
- [ ] Verify alarm KHÔNG ở INSUFFICIENT_DATA (trigger app trước Friday)
- [ ] Fix API Gateway access log format
- [ ] Tạo Log Insights saved query (chạy trên log group thật, có ≥5 rows)

### MH-SEC
- [ ] Tạo Lambda security-guard (S3 public access hoặc SG SSH)
- [ ] Tạo EventBridge rule on CloudTrail event
- [ ] Demo loop: tạo violation → Lambda fix → CloudTrail evidence
- [ ] Chụp before (insecure) + after (remediated) screenshots
- [ ] Tạo KMS CMK (nếu chọn Path A)
- [ ] Apply CMK vào S3 bucket
- [ ] Verify CloudTrail `kms:GenerateDataKey`
- [ ] Viết security-cost trade-off statement

### Evidence Pack
- [ ] Tạo `docs/W6_evidence.md` với đủ 6 sections
- [ ] Commit và post link lên Slack trước Friday slot

---

## Files Terraform cần tạo/sửa

| File | Action | Nội dung |
|------|--------|---------|
| `02-app/variables.tf` | **Sửa** | Thêm `Owner`, `CostCenter`, `Application` vào default tags |
| `01-network/main.tf` | **Sửa** | Đồng bộ tags |
| `02-app/budgets.tf` | **Tạo mới** | AWS Budgets $150 + SNS subscription |
| `02-app/cost-guard.tf` | **Tạo mới** | Lambda cost-guard + EventBridge Scheduler + IAM |
| `02-app/monitoring.tf` | **Tạo mới** | CloudWatch Dashboard + alarms + metric filters |
| `02-app/api-gateway.tf` | **Sửa** | Fix access log format (thêm latency, status, IP) |
| `02-app/security-guard.tf` | **Tạo mới** | Lambda security-guard + EventBridge rule + IAM |
| `02-app/kms.tf` | **Tạo mới** | KMS CMK + apply vào S3 bucket |
| `02-app/main.tf` | **Sửa** | S3 bucket: đổi AES256 → KMS CMK |
| `backend/lambda/cost-guard/` | **Tạo mới** | Lambda function code (Python) |
| `backend/lambda/security-guard/` | **Tạo mới** | Lambda function code (Python) |
| `backend/lambda/bedrock-chat/index.js` | **Sửa** | Thêm `PutMetricData` custom metric |
| `docs/W6_evidence.md` | **Tạo mới** | Evidence Pack |

---

## Ưu tiên thực hiện theo ngày

| Ngày | Việc cần làm |
|------|-------------|
| **Thứ 2** | Redeploy stack, fix tags (COST-V), activate cost allocation tags thủ công |
| **Thứ 3** | Build cost-guard Lambda + EventBridge (COST-A), cấu hình Budgets, demo stop EC2 |
| **Thứ 4** | Build security-guard Lambda (SEC), tạo KMS CMK, demo detect→fix loop |
| **Thứ 5** | Fix monitoring: custom metric, dashboard, alarm data, Log Insights query. Viết Evidence Pack |
| **Thứ 6 sáng** | Final check: alarm không INSUFFICIENT_DATA, post Evidence Pack link lên Slack |

---

## Rủi ro và cách tránh

| Rủi ro | Cách tránh |
|--------|-----------|
| Alarm ở INSUFFICIENT_DATA vào Friday | Invoke Lambda/app từ Thứ 5 để có data points |
| Cost allocation tags không hiện trong Cost Explorer | Activate trong Billing console ngay Thứ 2 (cần 24h để có data) |
| Budget cost-driven trigger không fire trong 48h | Expected — wire chain + test SNS publish + viết ADR |
| Vượt $150 | Dùng `cache.t3.micro`, `task_cpu=256`, single NAT GW, tắt resources overnight |
| Network Firewall tốn tiền (~$0.395/h per endpoint) | Đây là resource đắt nhất — cân nhắc tắt ngoài giờ demo |

---

## Detail Files

- [01-tagging-strategy.md](./01-tagging-strategy.md) — Tagging strategy document (1 page)
- [02-mh-cost-v.md](./02-mh-cost-v.md) — Cost Visibility implementation guide
- [03-mh-cost-a.md](./03-mh-cost-a.md) — Cost Guard Lambda + EventBridge
- [04-mh-obs.md](./04-mh-obs.md) — CloudWatch Dashboard + custom metric + Log Insights
- [05-mh-sec.md](./05-mh-sec.md) — Security Guard Lambda + KMS CMK
- [06-evidence-pack.md](./06-evidence-pack.md) — Template docs/W6_evidence.md
