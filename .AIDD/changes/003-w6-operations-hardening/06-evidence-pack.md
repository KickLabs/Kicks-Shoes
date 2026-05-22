# 06 — Evidence Pack Template: docs/W6_evidence.md

Copy file này thành `docs/W6_evidence.md` và điền vào trong quá trình làm.

---

```markdown
# W6 Evidence Pack — Kicks Shoes

**Group:** Group 13  
**Members:** [Điền tên thành viên]  
**Repo:** https://github.com/KickLabs/Kicks-Shoes  
**W5 Evidence Pack:** [link tới docs/W5_evidence.md]  
**Date:** 22-05-2026

---

## Section 1 — Cover

| Item | Value |
|------|-------|
| AWS Account ID | [account-id] |
| Region | us-east-1 |
| VPC ID | vpc-xxxxxxxx |
| ECS Cluster | kicks-shoes-dev-cluster |
| App URL | https://[cloudfront-domain].cloudfront.net |

### W5 Feedback → W5 Fix (bắt buộc — trainer feedback)

**Feedback W4 nhận được:** "Lambda bedrock-chat được invoke trực tiếp từ app backend, không có auth layer — bất kỳ caller nào cũng có thể trigger AI inference."

**W5 Fix:** Đặt API Gateway HTTP API (`kicks-shoes-bedrock-api`) với Lambda JWT Authorizer trước Lambda bedrock-chat. JWT được verify bằng cách đọc secret từ Secrets Manager (không hardcode). Negative test: `curl` không có token → 403 Forbidden. Throttle: 10 req/s rate, 20 burst.

---

## Section 2 — Carry-Forward: App Running End-to-End

> ⚠️ Phần này phải có ảnh thật — không dùng text mẫu.

**ECS Service RUNNING:**
[Screenshot: ECS console → kicks-shoes-dev-cluster → kicks-shoes-dev-service → Status: RUNNING, Desired: 1, Running: 1]

**ALB Target Healthy:**
[Screenshot: ALB Target Group → kicks-shoes-dev-tg → Target health: healthy]

**Live demo FE→ALB→ECS→DB:**

Action 1 — Product listing:
```bash
curl https://[cloudfront-domain].cloudfront.net/api/v1/products
# → 200 OK, JSON array of products
```
[Screenshot: browser hoặc curl response với product data từ MongoDB]

Action 2 — AI Chat (API Gateway → Lambda → Bedrock):
```bash
TOKEN=$(curl -s -X POST https://[cloudfront]/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}' | jq -r '.accessToken')

curl -X POST https://[api-gateway-url]/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What running shoes do you recommend?"}' \
  -w "\nHTTP: %{http_code}"
```
[Screenshot: 200 response với AI-generated shoe recommendation]

---

## Section 3 — MH-COST-V: Cost Visibility & Attribution

### Tags trên resources (4 keys bắt buộc)

[Screenshot: ECS Service tags — Owner, Environment=dev, CostCenter=G13, Application=KicksShoes]
[Screenshot: Lambda bedrock-chat tags — 4 keys]
[Screenshot: S3 uploads bucket tags — 4 keys]
[Screenshot: Network Firewall tags — 4 keys]

### Cost Allocation Tags Activated (Billing console)

[Screenshot: AWS Billing → Cost allocation tags → Owner: Active]
[Screenshot: AWS Billing → Cost allocation tags → Application: Active]

> ⚠️ Activate ngay Thứ 2 — cần 24h để tags xuất hiện trong Cost Explorer.

### Cost Tool: AWS Budgets

[Screenshot: Budgets console — kicks-shoes-dev-daily-150-cap, $150 threshold, SNS action]

### Cost Tool: Cost Anomaly Detection

[Screenshot: Cost Anomaly Detection monitor — scoped to Application=KicksShoes]

### Baseline Cost Breakdown (sau ≥24h redeployment)

[Screenshot: Cost Explorer → Filter: Application=KicksShoes → Group by: Service → last 7 days]

**Top 3 cost drivers observation:**

> 1. **Network Firewall** (~$0.395/h/endpoint × 2 endpoints × 24h ≈ $19) — resource đắt nhất.
>    W6 fix: deploy 2 endpoints (Multi-AZ) thay vì 1 — cost tăng gấp đôi nhưng HA được đảm bảo.
>    Production justification: egress control là security requirement, không phải optional.
> 2. **ECS Fargate** (256 CPU / 512 MB × 24h ≈ $0.30) — rất thấp, smallest viable task size.
> 3. **ElastiCache Redis** (cache.t3.micro × 24h ≈ $0.41) — single node, dev-appropriate.
>
> Surprising: Network Firewall chiếm >90% total cost dù traffic volume thấp.
> Optimization: tắt Firewall ngoài giờ demo trong dev account để tiết kiệm ~$15/ngày.

### Tagging Strategy Document

**Required keys:**

| Key | Allowed values | Rule |
|-----|---------------|------|
| `Owner` | `team-lead@email.com` | Lowercase email, nhất quán |
| `Environment` | `dev` | Không dùng `Dev`, `DEV` |
| `CostCenter` | `G13` | Group ID |
| `Application` | `KicksShoes` | Không dùng `kicks-shoes`, `kicksshoes` |

**Enforcement in production:** AWS Config rule `required-tags` + SCP deny `ec2:RunInstances` nếu thiếu tags.

---

## Section 4 — MH-COST-A: Cost Control & Action

### Lambda Cost Guard

**Function:** `kicks-shoes-dev-cost-guard`  
**Runtime:** Python 3.12  
**Logic:** Stop EC2/RDS tagged `Environment=dev` và không tagged `keep=true`  
**IAM role:** Least-privilege — chỉ `ec2:StopInstances`, `ec2:DescribeInstances`, `rds:StopDBInstance`, `rds:DescribeDBInstances`

[Screenshot: Lambda console — function overview, runtime, role]
[Screenshot: IAM role policy — chỉ 2 actions, không có wildcard]

### EventBridge Daily Schedule

[Screenshot: EventBridge Scheduler — kicks-shoes-dev-cost-guard-daily, cron(0 20 * * ? *)]

### Demonstrated Stop (CloudTrail Evidence)

**Before — EC2 instance RUNNING:**
[Screenshot: EC2 console → instance i-xxxxxxxx → State: running]

**Lambda execution log:**
[Screenshot: CloudWatch Logs → /aws/lambda/kicks-shoes-dev-cost-guard → "Stopping EC2 instance: i-xxxxxxxx"]

**After — EC2 instance STOPPED:**
[Screenshot: EC2 console → instance i-xxxxxxxx → State: stopped]

**CloudTrail evidence:**
[Screenshot: CloudTrail → Event history → EventName=StopInstances → userAgent contains "lambda"]

### Budgets $150 → SNS → Lambda Chain

[Screenshot: AWS Budgets — threshold $150, notification type ACTUAL, SNS topic = kicks-shoes-dev-alerts]
[Screenshot: SNS topic kicks-shoes-dev-alerts → Subscriptions → Lambda endpoint = kicks-shoes-dev-cost-guard]

**Test SNS publish (demo chain):**
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:<account>:kicks-shoes-dev-alerts \
  --message '{"AlarmName":"BudgetTest","NewStateValue":"ALARM","Trigger":{"Threshold":150}}' \
  --region us-east-1
```
[Screenshot: Lambda invoked via SNS → CloudWatch Logs → EC2 stopped]
[Screenshot: CloudTrail → StopInstances triggered by SNS→Lambda chain]

### ADR — Cost Data Latency

**Context:** AWS cost data lags ~8–24h. Trong 48h workshop account, Budgets cost-driven trigger sẽ KHÔNG fire vì không đủ thời gian tích lũy cost data.

**Decision:** Wire chain đầy đủ (Budgets → SNS → Lambda) nhưng demo bằng cách publish test message lên SNS thủ công. Full credit = chain wired + SNS test publish drives a stop + ADR này.

**Production behavior:** Cost-driven trigger fires sau 8–24h khi cost data available. Daily scheduled trigger (20:00 UTC) là primary mechanism trong workshop.

---

## Section 5 — MH-OBS: CloudWatch Observability

### CloudWatch Dashboard

[Screenshot: Dashboard kicks-shoes-dev-operations — toàn bộ 4 widgets có data points thật]

**Widget 1 — Custom Metric (bắt buộc phải label rõ):**
- Title: **"Bedrock Query Latency (Custom Metric)"**
- Namespace: `KicksShoes/Operations`
- Metric: `BedrockQueryLatencyMs`
- Dimensions: `Environment=dev, Application=KicksShoes`

**Widget 2 — Standard:**
- Title: "ECS CPU Utilization"
- Namespace: `AWS/ECS`, Metric: `CPUUtilization`

**Widget 3 — Standard:**
- Title: "Lambda Errors (bedrock-chat)"
- Namespace: `AWS/Lambda`, Metric: `Errors`

**Widget 4 — Standard:**
- Title: "API Gateway 4XX Errors"
- Namespace: `AWS/ApiGateway`, Metric: `4XXError`

### Custom Metric — PutMetricData Code Snippet

```javascript
// backend/lambda/bedrock-chat/index.js — W6 addition
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION });

async function publishMetric(metricName, value, unit = "Milliseconds") {
  await cwClient.send(new PutMetricDataCommand({
    Namespace: "KicksShoes/Operations",
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Dimensions: [
        { Name: "Environment", Value: "dev" },
        { Name: "Application", Value: "KicksShoes" }
      ]
    }]
  }));
}

// Called after each Bedrock invocation:
await publishMetric('BedrockQueryLatencyMs', responseTime);  // success
await publishMetric('BedrockQueryErrors', 1, 'Count');       // error path
```

### CloudWatch Alarm

**Alarm:** `kicks-shoes-dev-lambda-errors`  
**Metric:** `AWS/Lambda :: Errors :: FunctionName=kicks-shoes-dev-bedrock-chat`  
**Threshold:** > 5 errors in 5 minutes  
**State on Friday:** OK hoặc ALARM — **KHÔNG phải INSUFFICIENT_DATA**  
**Action:** SNS → kicks-shoes-dev-alerts

[Screenshot: Alarm configuration — metric, threshold, evaluation period, action]
[Screenshot: Alarm state = **OK** hoặc **ALARM** — state label rõ ràng]

> ⚠️ Invoke Lambda với bad input ít nhất 6 lần vào Thứ 5 để có data points.

### Log Insights Saved Query

**Query name:** `kicks-shoes-lambda-error-spikes`  
**Log group:** `/aws/lambda/kicks-shoes-dev-bedrock-chat`

```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as error_count by bin(5m)
| sort @timestamp desc
| limit 20
```

[Screenshot: Logs Insights → Saved Queries → query name visible in list]
[Screenshot: Query results — ≥5 rows với timestamps và error_count thật]

---

## Section 6 — MH-SEC: Self-Healing Security Guard

### Lambda Security Guard

**Function:** `kicks-shoes-dev-security-guard`  
**Runtime:** Python 3.12  
**Logic:** Scan project S3 buckets → nếu Block Public Access OFF → gọi `PutPublicAccessBlock`  
**IAM role:** Least-privilege — chỉ `s3:PutPublicAccessBlock`, `s3:GetPublicAccessBlock`, `s3:ListAllMyBuckets`

[Screenshot: Lambda console — function overview]
[Screenshot: IAM role policy — 3 actions only, no wildcard resource]

### EventBridge Trigger

[Screenshot: EventBridge rule — kicks-shoes-dev-s3-public-access-guard]
[Screenshot: Event pattern — source=aws.s3, eventName=[PutBucketPolicy, PutBucketAcl, DeletePublicAccessBlock]]

### Demonstrated Detect→Fix Loop

**Step 1 — BEFORE (insecure):**
```bash
aws s3api delete-public-access-block --bucket kicks-shoes-<account>-uploads
aws s3api get-public-access-block --bucket kicks-shoes-<account>-uploads
# → NoSuchPublicAccessBlockConfiguration
```
[Screenshot: S3 console → bucket → Permissions → Block Public Access: **OFF** (red warning)]

**Step 2 — Lambda triggered (EventBridge or manual):**
[Screenshot: CloudWatch Logs → "VIOLATION: Bucket kicks-shoes-...-uploads has public access enabled. Remediating..."]
[Screenshot: CloudWatch Logs → "REMEDIATED: Block Public Access re-enabled on kicks-shoes-...-uploads"]

**Step 3 — AFTER (remediated):**
```bash
aws s3api get-public-access-block --bucket kicks-shoes-<account>-uploads
# → BlockPublicAcls: true, IgnorePublicAcls: true, BlockPublicPolicy: true, RestrictPublicBuckets: true
```
[Screenshot: S3 console → bucket → Permissions → Block Public Access: **ON** (all 4 green)]

**Step 4 — CloudTrail evidence (bắt buộc):**
[Screenshot: CloudTrail → Event history → EventName=**PutPublicAccessBlock** → userAgent contains "lambda" → timestamp sau violation]

### Supporting Preventive Control — KMS CMK

**Key alias:** `alias/kicks-shoes-dev-s3-uploads`  
**Type:** Symmetric, Encrypt and Decrypt  
**Rotation:** Enabled (annual automatic)  
**Applied to:** S3 uploads bucket (`sse_algorithm = aws:kms`, `kms_master_key_id = CMK ARN`)

[Screenshot: KMS console → Customer managed keys → kicks-shoes-dev-s3-uploads → Key rotation: Enabled]
[Screenshot: S3 bucket → Properties → Default encryption → SSE-KMS, key = alias/kicks-shoes-dev-s3-uploads]
[Screenshot: CloudTrail → Event history → EventName=**kms:GenerateDataKey** → userAgent=s3.amazonaws.com]

### Security Threat Paragraph

**Misconfiguration guarded:** S3 uploads bucket Block Public Access disabled.

**Blast radius if unremediated:** Toàn bộ product images và user-uploaded content accessible publicly. Attacker có thể enumerate bucket, download files, và nếu có PII trong uploads → GDPR violation. Bucket URL có thể bị abuse để serve malicious content từ trusted domain.

**Auto-remediation time:** < 1 phút sau khi violation xảy ra (EventBridge rule on CloudTrail event).

### Security-Cost Trade-off

KMS CMK: $1/month/key + $0.03/10,000 API calls. Justified vì: mỗi `kms:Decrypt` event được logged trong CloudTrail với IAM principal, timestamp, và resource ARN — đây là audit trail requirement cho e-commerce platform xử lý user data. Chi phí $1/month không đáng kể so với forensics capability khi có incident.

---

## Section 7 — W5 Fixes Applied (W6 carry-forward improvements)

### Fix 1 — Network Firewall: Single-AZ → Multi-AZ

**W5 issue:** Firewall endpoints deploy vào `public_subnet_ids` — chỉ 1 AZ thực tế, hidden HA SPOF.

**W6 fix:** Dùng `data.aws_subnets.firewall.ids` (Tier=firewall) — 2 dedicated subnets, 2 AZ.

[Screenshot: Network Firewall console → Firewall endpoints → **2 endpoints, 2 different AZs**]
[Screenshot: Route table private subnet AZ-a → 0.0.0.0/0 → vpce-xxx (AZ-a firewall endpoint)]
[Screenshot: Route table private subnet AZ-b → 0.0.0.0/0 → vpce-yyy (AZ-b firewall endpoint)]

### Fix 2 — MH5 DLQ: Real payload shape

**W5 issue:** DLQ payload screenshot trông như placeholder, không khớp DLQ thật từ DynamoDB Streams ESM.

**Real DLQ message shape** (từ `destination_config.on_failure` trên DynamoDB Streams ESM):
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
  "DDBStreamBatchInfo": {
    "shardId": "shardId-00000001234567890123-abcdefgh",
    "startSequenceNumber": "1234567890123456789012345678901234",
    "endSequenceNumber": "1234567890123456789012345678901234",
    "approximateArrivalOfFirstRecord": "2026-05-20T10:29:55.000Z",
    "batchSize": 1,
    "streamArn": "arn:aws:dynamodb:us-east-1:<account>:table/kicks-shoes-dev-table/stream/..."
  }
}
```

**Key indicators của DLQ thật:**
- `condition: "RetriesExhausted"` — đã retry đủ 2 lần
- `approximateInvokeCount: 3` — 1 lần đầu + 2 retry
- `DDBStreamBatchInfo.shardId` — shardId thật từ DynamoDB stream
- `functionError: "Unhandled"` — Lambda throw uncaught error

[Screenshot: SQS console → kicks-shoes-dev-bedrock-dlq → **NumberOfMessagesSent > 0**]
[Screenshot: SQS → Receive messages → message body với `condition: "RetriesExhausted"` và `DDBStreamBatchInfo`]

**CloudWatch scaling evidence (3 charts):**

Chart 1 — Lambda Throttles:
[Screenshot: CloudWatch → AWS/Lambda :: Throttles :: FunctionName=kicks-shoes-dev-bedrock-chat → time series]

Chart 2 — DLQ Messages Sent:
[Screenshot: CloudWatch → AWS/SQS :: NumberOfMessagesSent :: QueueName=kicks-shoes-dev-bedrock-dlq → time series]

Chart 3 — Lambda Init Duration p99 (cold starts):
```
# Log Insights query — /aws/lambda/kicks-shoes-dev-bedrock-chat
filter @type = "REPORT"
| stats pct(@initDuration, 99) as init_p99,
        avg(@initDuration) as init_avg,
        count(*) as cold_starts
  by bin(1h)
| filter ispresent(init_p99)
| sort @timestamp desc
```
[Screenshot: Log Insights results — init_p99 value visible (e.g., 1200ms for VPC cold start)]

### Fix 3 — MH3 Backup: Correct resource labels + integrity proof

**W5 issue:** Evidence pack nhãn tài nguyên thứ ba là "EBS (nếu có)" — sai. Thực tế đã backup 3 resources thật.

**Correct backup resources:**
1. ✅ **EFS** — `fs-xxxxxxxx` (kicks-shoes-dev-efs)
2. ✅ **DynamoDB chat messages** — `kicks-shoes-dev-table` (chat_messages table)
3. ✅ **DynamoDB main** — `kicks-shoes-dev-table` (main table — **không phải EBS**)

[Screenshot: AWS Backup → Protected resources → 3 resources: EFS + 2 DynamoDB tables]
[Screenshot: Recovery points — tất cả 3 resources có status Completed]

**Integrity proof sau restore:**
```bash
# EFS restore integrity
sudo mount -t nfs4 <restored-efs-dns>:/ /mnt/restored-efs
ls -la /mnt/restored-efs/
cat /mnt/restored-efs/test.txt
# Expected: "W5 EFS test - <timestamp>"

# DynamoDB restore integrity
aws dynamodb scan \
  --table-name <restored-table-name> \
  --select COUNT \
  --region us-east-1
# Expected: {"Count": N} — N > 0 chứng minh data intact
```
[Screenshot: `ls -la /mnt/restored-efs/` output — files visible]
[Screenshot: `cat /mnt/restored-efs/test.txt` — content matches original]
[Screenshot: DynamoDB scan COUNT > 0 trên restored table]

---

## Section 8 — Project Recap

**Application:** Kicks Shoes — e-commerce platform bán giày thể thao và thời trang.

**Business domain:** B2C retail với AI-powered product recommendations (Bedrock RAG), real-time chat (Socket.IO), flash sales, livestream shopping, và multi-payment gateway (VNPay, PayOS).

**Architecture decisions carried forward (W1–W5):**
- **W1:** 3-tier (ALB → ECS Fargate → MongoDB Atlas), CloudFront CDN, single-tenant
- **W2:** S3 uploads (Block Public Access), IAM least-privilege, Secrets Manager
- **W3:** DynamoDB chat messages, Lambda bedrock-chat, Bedrock Knowledge Base RAG
- **W4:** Multi-level retrieval, ElastiCache Redis session cache, Bedrock Agent tools
- **W5:** Network Firewall egress (domain allowlist), VPC Flow Logs, EFS shared storage, API Gateway + JWT Authorizer, DLQ for async failures

**W6 operational layer added:**
- Cost visibility: 4-key tagging + Cost Explorer + Budgets
- Cost control: automated Lambda cost guard + EventBridge daily schedule
- Monitoring: custom CloudWatch metrics (BedrockQueryLatencyMs) + dashboard + alarms
- Self-healing security: S3 public access guard + KMS CMK audit trail
- HA fix: Network Firewall Multi-AZ (2 endpoints, 2 AZs)
```
