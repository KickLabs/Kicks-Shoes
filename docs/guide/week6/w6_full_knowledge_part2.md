# Cẩm nang Kiến thức Toàn diện W6 — Phần 2: Monitoring & Self-Healing Security

> 👉 [Xem lại Phần 1: MH-COST-V & MH-COST-A](./w6_full_knowledge_part1.md)  
> 👉 **Mất gốc:** [w6_foundations.md](./w6_foundations.md)

---

## Ba trụ cột Observability (giải thích cho người mới)

| Trụ | Hỏi câu gì | W6 dùng |
|-----|------------|---------|
| **Metrics** | Có chậm / cao bất thường? | Bedrock latency, ECS CPU, Lambda Errors |
| **Logs** | Lỗi chi tiết là gì? | API GW access log, Lambda log |
| **Traces** | Request đi qua đâu? | *(X-Ray — không bắt buộc W6)* |

**Demonstrable** = mentor phải thấy **ảnh Dashboard + alarm state + Log Insights có dòng** — không chỉ “em đã bật CloudWatch”.

---

## MH-OBS — Monitoring (Observability)

### 📚 Định nghĩa tổng quan

**Observability** = khả năng hiểu trạng thái hệ thống từ **metrics, logs, traces** bên ngoài — giống bác sĩ đọc **nhiệt độ + xét nghiệm + bệnh án**.

W6 yêu cầu **demonstrable** observability — không chỉ bật CloudWatch mặc định.

### 📚 Bảng thuật ngữ

| Thuật ngữ | Định nghĩa |
| :--- | :--- |
| **Metric** | Số đo theo thời gian (CPU %, latency ms, error count). |
| **Statistic** | Average, Sum, p99 — cách aggregate data points. |
| **Period** | Cửa sổ aggregation (60s, 300s). |
| **Alarm** | Rule: metric vượt threshold → action (SNS, auto scaling). |
| **Composite Alarm** | Alarm kết hợp nhiều alarm con (AND/OR). |
| **Log Group** | Container logs — retention configurable. |
| **Metric Filter** | Parse log text → tạo metric từ pattern (VD: count ERROR). |
| **X-Ray** | Distributed tracing — *(stretch, không bắt buộc W6)* |

### 🛤️ Path A — Custom Application Metrics (Team chọn)

#### Khi nào chọn?

- Cần metric **business-specific** (Bedrock latency, order rate)
- Lambda/ECS có quyền `cloudwatch:PutMetricData`

#### Implementation pattern

```javascript
// Namespace tránh trùng AWS default
Namespace: "KicksShoes/Operations"
Metrics: BedrockQueryLatencyMs | BedrockQueryCount | BedrockQueryErrors
Dimensions: Environment, Application
```

**Best practice:**
- Publish **non-blocking** — catch error, không fail handler chính
- Dùng **Count** unit cho counter, **Milliseconds** cho latency

#### Console verify

CloudWatch → Metrics → All metrics → Custom namespaces → `KicksShoes/Operations`

### 🛤️ Path B — CloudWatch Dashboard (Team chọn)

#### Widget types

| Type | Use case W6 |
|------|-------------|
| Line (timeSeries) | Latency, CPU over time |
| Number (singleValue) | Current error count |
| Text (markdown) | Link runbook — optional |

#### Yêu cầu đề: 3 widget types

1. **Custom** — BedrockQueryLatencyMs
2. **Standard AWS** — ECS CPUUtilization
3. **Standard AWS** — Lambda Errors hoặc API Gateway 4XX

### 🛤️ Path C — Alarms & INSUFFICIENT_DATA

| State | Ý nghĩa | Evidence |
|-------|---------|----------|
| OK | Metric dưới threshold | ✅ acceptable |
| ALARM | Vượt threshold | ✅ acceptable (có data) |
| INSUFFICIENT_DATA | Chưa đủ periods có data | ❌ mentor reject |

**Cách fix:** Invoke workload trước deadline — 3+ data points trong evaluation window.

```hcl
treat_missing_data = "notBreaching"  # Không ALARM khi thiếu data — vẫn có thể INSUFFICIENT_DATA state
```

### 🛤️ Path D — API Gateway Access Logs (Team chọn)

HTTP API `$context` variables quan trọng:

| Variable | Ý nghĩa |
|----------|---------|
| `requestId` | Correlation ID |
| `identity.sourceIp` | Client IP |
| `responseLatency` | Tổng latency ms |
| `integrationLatency` | Lambda/backend latency |
| `status` | HTTP status |
| `routeKey` | `POST /chat` |

**Log Insights** trên JSON log:

```
fields @timestamp, ip, status, responseLatency, routeKey
| filter responseLatency > 2000
| sort responseLatency desc
| limit 50
```

### 🛤️ Path E — Container Insights / ADOT (không chọn Kicks Shoes)

- ECS Container Insights — metric sẵn, chi phí thêm
- ADOT collector — OpenTelemetry — phù hợp production lớn

---

## MH-SEC — Self-Healing Security Guard

### 📚 Định nghĩa

**Detect → Fix loop** = hệ thống tự phát hiện drift/violation và **remediate** không cần human ticket.

Khác **preventive only** (SCP, bucket policy deny) — W6 cần **chứng minh vòng lặp** với CloudTrail before/after.

### 📚 Bảng thuật ngữ

| Thuật ngữ | Định nghĩa |
| :--- | :--- |
| **Block Public Access** | 4 flags chặn public ACL/policy trên bucket. |
| **CloudTrail** | Audit log API calls — nguồn EventBridge rules. |
| **EventBridge** | Event bus — pattern match CloudTrail events. |
| **Remediation** | API call khôi phục trạng thái secure. |
| **CMK** | Customer Managed Key — KMS key bạn sở hữu policy. |
| **SSE-S3** | Encryption mặc định S3 managed key — không audit per-object key như CMK. |
| **Confused Deputy** | Rủi ro cross-account — CMK policy cần condition `aws:SourceArn`. |

### 🛤️ Detect-Fix Option A — S3 Public Access (Team chọn)

#### Events trigger

| EventName | Khi nào fire |
|-----------|--------------|
| `PutBucketPolicy` | Policy cho phép public read |
| `PutBucketAcl` | ACL public |
| `DeletePublicAccessBlock` | Tắt BPA — demo chính |

#### EventBridge pattern

```json
{
  "source": ["aws.s3"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventSource": ["s3.amazonaws.com"],
    "eventName": ["PutBucketPolicy", "PutBucketAcl", "DeletePublicAccessBlock"]
  }
}
```

> **Lưu ý:** CloudTrail phải **enabled** (mặc định management events). Event delivery có delay vài giây.

#### Remediation API

```python
s3.put_public_access_block(
    Bucket=bucket_name,
    PublicAccessBlockConfiguration={
        'BlockPublicAcls': True,
        'IgnorePublicAcls': True,
        'BlockPublicPolicy': True,
        'RestrictPublicBuckets': True,
    }
)
```

### 🛤️ Detect-Fix Option B — Security Group SSH (alternative)

| Detect | Fix |
|--------|-----|
| `AuthorizeSecurityGroupIngress` port 22 from `0.0.0.0/0` | `RevokeSecurityGroupIngress` |

Phù hợp khi stack nhiều EC2 SSH — Kicks Shoes dùng Fargate → Option A phù hợp hơn.

### 🛤️ Preventive Path A — KMS CMK (Team chọn)

#### Terraform pattern

```hcl
resource "aws_kms_key" "s3_uploads" {
  enable_key_rotation = true
  # Policy: root full access + s3.amazonaws.com GenerateDataKey
}

resource "aws_s3_bucket_server_side_encryption_configuration" "..." {
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_uploads.arn
    }
  }
}
```

#### CloudTrail evidence

Filter: Event name = `GenerateDataKey`, User agent contains `s3.amazonaws.com`

#### Cost

~$1/month/key + $0.03 per 10k requests — justified trong evidence 1 câu.

### 🛤️ Preventive Path B — Account-level BPA + Deny Policy

```hcl
resource "aws_s3_account_public_access_block" "strict" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy deny non-TLS
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:PutObject",
  "Condition": { "Bool": { "aws:SecureTransport": "false" } }
}
```

Không có detect-fix loop tự động — pair với Option A nếu mentor yêu cầu cả preventive + reactive.

---

## W5 Trainer Feedback → W6 (tóm tắt)

| Feedback | W6 fix |
|----------|--------|
| Firewall single-AZ | Multi-AZ firewall subnets (`data.aws_subnets.firewall`) |
| DLQ placeholder payload | Real DLQ message shape + CW metrics |
| Lambda invoke không qua API GW | W5 đã có JWT API GW — W6 thêm OBS metric + SEC guard |

Chi tiết: `.AIDD/changes/003-w6-operations-hardening/00-trainer-feedback-fixes.md`

---

## Bảng tổng hợp: Service → W6 MH

| AWS Service | MH-COST-V | MH-COST-A | MH-OBS | MH-SEC |
|-------------|-----------|-----------|--------|--------|
| Resource Groups Tagging | ✅ | | | |
| AWS Budgets | ✅ | ✅ | | |
| Cost Explorer | ✅ | | | |
| Lambda | | ✅ | ✅ metric | ✅ guard |
| EventBridge Scheduler | | ✅ | | ✅ scan |
| SNS | | ✅ | ✅ alarm | |
| CloudWatch | | | ✅ | |
| API Gateway | | | ✅ logs | |
| S3 | ✅ tags | | | ✅ BPA + KMS |
| KMS | | | | ✅ CMK |
| CloudTrail | | ✅ demo | | ✅ demo |

---

## Câu hỏi ôn tập (self-check) — Gợi ý đáp án

| # | Câu hỏi | Gợi ý trả lời |
|---|---------|----------------|
| 1 | Activate tag bằng TF được không? | Không — Billing console/API riêng |
| 2 | Budget alert delay? | 8–24h Actual cost; test SNS publish |
| 3 | Stop vs Terminate? | Stop giữ disk; Terminate xóa hẳn |
| 4 | Tránh INSUFFICIENT_DATA? | Invoke app/Lambda trước deadline |
| 5 | S3 guard vs SG SSH? | Fargate không SSH; S3 uploads là risk thật |
| 6 | CMK vs SSE-S3? | CMK ~$1 + audit; SSE-S3 rẻ hơn, ít audit |
| 7 | EventBridge match DeletePublicAccessBlock? | `source=aws.s3`, `detail-type` CloudTrail, `eventName` đúng |

---

## Tổng kết 1 trang — W6 trong đầu bạn

```
W5 = app chạy được + mạng an toàn
W6 = app vận hành được:
  - Biết tiền (tags, Cost Explorer, Budget)
  - Cắt tiền (cost-guard)
  - Thấy sức khỏe (dashboard, alarm, logs)
  - Tự vá S3 (security-guard + KMS)
Evidence = ảnh + CloudTrail + không INSUFFICIENT_DATA
```

---

> 👉 Thực hành: [w6_foundations.md](./w6_foundations.md) → [w6_must_haves_mapping.md](./w6_must_haves_mapping.md) → [w6_must_haves_part2.md](./w6_must_haves_part2.md) → [README](./README.md)
