# 00 — Trainer Feedback Fixes (W5 → W6)

Tài liệu này map từng điểm feedback của trainer vào code change cụ thể.

---

## Fix 1 — Network Firewall: Single-AZ SPOF → Multi-AZ ✅

**Feedback:** "Network Firewall endpoint chỉ ở một AZ trong khi tuyên bố Multi-AZ — đây là rủi ro HA ngầm; W6 deploy endpoint thứ hai ở AZ khác."

**Root cause:** `network-firewall.tf` dùng `local.public_subnet_ids` thay vì `data.aws_subnets.firewall.ids`. Public subnets có thể chỉ resolve 1 AZ trong một số account configs, và quan trọng hơn — firewall endpoints phải nằm trong **dedicated firewall subnets** (intra tier), không phải public subnets.

**Fix đã apply:**

File: `infra/terraform/environments/dev/02-app/data.tf`
```hcl
# Thêm data source cho firewall subnets
data "aws_subnets" "firewall" {
  filter { name = "vpc-id",  values = [data.aws_vpc.main.id] }
  filter { name = "tag:Tier", values = ["firewall"] }
}
```

File: `infra/terraform/environments/dev/02-app/network-firewall.tf`
```hcl
# TRƯỚC (sai): dùng public_subnet_ids → chỉ 1 AZ
dynamic "subnet_mapping" {
  for_each = local.public_subnet_ids  # ❌
  ...
}

# SAU (đúng): dùng firewall subnets → 2 AZ (10.0.30.0/24 + 10.0.31.0/24)
dynamic "subnet_mapping" {
  for_each = data.aws_subnets.firewall.ids  # ✅
  ...
}
```

**Kết quả:** Network Firewall có 2 endpoints — một ở AZ-a (10.0.30.0/24), một ở AZ-b (10.0.31.0/24). Nếu một AZ fail, traffic tự động route qua endpoint còn lại.

**Evidence cần chụp:**
- Console: Network Firewall → Firewall endpoints → 2 endpoints, 2 AZ khác nhau
- Console: Route table private subnets → mỗi AZ route về firewall endpoint của AZ đó

---

## Fix 2 — MH5 DLQ: Payload trông như placeholder → Real shape + CloudWatch evidence ✅

**Feedback:** "Bằng chứng scaling của MH5 còn yếu — payload DLQ trông như mẫu placeholder, shape không khớp DLQ thật; bổ sung biểu đồ Throttles, biểu đồ số message trong DLQ và Init Duration p99."

**Root cause:** DLQ message từ DynamoDB Streams Event Source Mapping có shape khác với DLQ từ async Lambda invocation. Evidence pack W5 dùng shape sai.

**DLQ message shape thật** (từ DynamoDB Streams ESM `destination_config.on_failure`):

```json
{
  "requestContext": {
    "requestId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "functionArn": "arn:aws:lambda:us-east-1:<account>:function:kicks-shoes-dev-bedrock-chat",
    "condition": "RetriesExhausted",
    "approximateInvokeCount": 3
  },
  "responseContext": {
    "statusCode": 200,
    "executedVersion": "$LATEST",
    "functionError": "Unhandled"
  },
  "version": "1.0",
  "timestamp": "2026-05-20T10:30:00.000Z",
  "KinesisBatchInfo": null,
  "DDBStreamBatchInfo": {
    "shardId": "shardId-00000001234567890123-abcdefgh",
    "startSequenceNumber": "1234567890123456789012345678901234",
    "endSequenceNumber": "1234567890123456789012345678901234",
    "approximateArrivalOfFirstRecord": "2026-05-20T10:29:55.000Z",
    "approximateArrivalOfLastRecord": "2026-05-20T10:29:55.000Z",
    "batchSize": 1,
    "streamArn": "arn:aws:dynamodb:us-east-1:<account>:table/kicks-shoes-dev-table/stream/2026-05-20T00:00:00.000"
  }
}
```

**Key fields để nhận ra đây là DLQ thật:**
- `condition: "RetriesExhausted"` — đã retry đủ 2 lần
- `approximateInvokeCount: 3` — 1 lần đầu + 2 retry = 3
- `DDBStreamBatchInfo` — chứa shardId, sequenceNumber, streamArn thật
- `functionError: "Unhandled"` — Lambda throw error

**CloudWatch metrics cần chụp cho Evidence Pack:**

1. **Lambda Throttles** — `AWS/Lambda :: Throttles :: FunctionName=kicks-shoes-dev-bedrock-chat`
   - Để có data: invoke Lambda nhiều lần vượt concurrency limit
   - Hoặc set reserved concurrency = 0 tạm thời → mọi invoke đều bị throttle

2. **SQS NumberOfMessagesSent** — `AWS/SQS :: NumberOfMessagesSent :: QueueName=kicks-shoes-dev-bedrock-dlq`
   - Tự động có data sau khi Lambda fail và message vào DLQ

3. **Lambda Init Duration p99** — trong CloudWatch Logs Insights:
   ```
   filter @type = "REPORT"
   | stats pct(@initDuration, 99) as init_p99, 
           avg(@initDuration) as init_avg,
           count(*) as cold_starts
   by bin(1h)
   | filter ispresent(init_p99)
   ```
   - `@initDuration` chỉ xuất hiện trong cold starts
   - Chạy query này trên log group `/aws/lambda/kicks-shoes-dev-bedrock-chat`

**Fix đã apply:**

File: `backend/lambda/bedrock-chat/index.js`
- Thêm `CloudWatchClient` import
- Thêm `publishMetric()` helper function
- Gọi `publishMetric('BedrockQueryLatencyMs', responseTime)` sau mỗi Bedrock call thành công
- Gọi `publishMetric('BedrockQueryErrors', 1, 'Count')` trong error path

File: `infra/terraform/modules/lambda/main.tf`
- Thêm IAM policy `cloudwatch-metrics` cho Lambda execution role
- Cho phép `cloudwatch:PutMetricData` với condition `namespace = KicksShoes/Operations`

---

## Fix 3 — MH3 Backup: Nhãn sai + thiếu integrity proof ✅

**Feedback:** "MH3 thực tế đã backup đủ 3 tài nguyên thật (EFS + 2 bảng DynamoDB, recovery point đều Completed) — chỉ cần sửa nhãn trong pack: tài nguyên thứ ba là dynamodb-main chứ không phải 'EBS (nếu có)', và thêm cat/ls sau restore để chứng minh integrity rõ hơn."

**Fix trong Evidence Pack template:**

Sửa Section MH3 — 3 backup resources:
- ✅ EFS: `fs-xxxxxxxx` (kicks-shoes-dev-efs)
- ✅ DynamoDB chat messages: `kicks-shoes-dev-table` (chat_messages table)
- ✅ DynamoDB main: `kicks-shoes-dev-table` (main table — **không phải EBS**)

**Integrity proof commands sau restore:**

```bash
# Sau khi restore EFS → mount vào EC2 test instance
sudo mount -t nfs4 \
  -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport \
  <restored-efs-dns>:/ /mnt/restored-efs

# Verify data integrity
ls -la /mnt/restored-efs/
cat /mnt/restored-efs/test.txt
# Expected: "W5 EFS test - <timestamp>"

# Sau khi restore DynamoDB → scan table
aws dynamodb scan \
  --table-name <restored-table-name> \
  --select COUNT \
  --region us-east-1
# Expected: {"Count": N, "ScannedCount": N} — N > 0 chứng minh data intact

# Hoặc query 1 item cụ thể
aws dynamodb get-item \
  --table-name <restored-table-name> \
  --key '{"pk": {"S": "CONV#test"}}' \
  --region us-east-1
```

---

## Fix 4 — Carry-Forward: Thiếu ảnh + thiếu W4 feedback ✅

**Feedback:** "Phần carry-forward mới có 3 đoạn text mẫu, không ảnh — phải demo trực tiếp luồng FE→ALB→ECS→DB. Cover chỉ link pack W4, chưa có mục 'góp ý trước / đã đổi gì' — trích 1 góp ý W4 + cách sửa W5."

**Action items (không phải code — cần làm thủ công):**

1. **Demo live FE→ALB→ECS→DB** trong Part 4 Friday:
   - Mở browser → app URL → login → browse products → add to cart
   - Hoặc: `curl https://[cloudfront]/api/v1/products` → show JSON response
   - Chụp screenshot: ECS service RUNNING + ALB target healthy + MongoDB query log

2. **Thêm W4 feedback vào Evidence Pack Section 1:**
   ```markdown
   **W4 Feedback received:** "Lambda invoke trực tiếp từ app, không có auth layer"
   **W5 Fix:** Đặt API Gateway HTTP API với Lambda JWT Authorizer trước Lambda 
   bedrock-chat (MH4). JWT được verify qua Secrets Manager thay vì hardcode. 
   Negative test: curl không có token → 403.
   ```

---

## Summary — Files Changed

| File | Change |
|------|--------|
| `infra/terraform/environments/dev/02-app/data.tf` | Thêm `data.aws_subnets.firewall` |
| `infra/terraform/environments/dev/02-app/network-firewall.tf` | Dùng `firewall.ids` thay `public_subnet_ids` |
| `infra/terraform/modules/lambda/main.tf` | Thêm IAM policy `cloudwatch:PutMetricData` |
| `backend/lambda/bedrock-chat/index.js` | Thêm CloudWatch client + `publishMetric()` + metric calls |
| `.AIDD/changes/003-w6-operations-hardening/06-evidence-pack.md` | Cập nhật MH3 labels + DLQ shape + CloudWatch widgets |
