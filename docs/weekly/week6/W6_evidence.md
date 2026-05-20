# W6 Evidence Pack — Operations Hardening & Cost-Aware Cloud

**Dự án:** Kicks Shoes Cloud Platform  
**Đơn vị triển khai:** Team 13Hz  
**Tài liệu tham chiếu:** Mô hình Kiến trúc Tuần 6 (Vận hành, Giám sát và Tối ưu Chi phí)  
**Ngày hoàn thành:** 22/05/2026

---

## 1. Thông tin Chung (Cover)

- **Group ID / Tên dự án:** Kicks Shoes E-commerce & AI Assistant
- **Thành viên triển khai:** Nhóm 13Hz
- **Repository:** [Kicks-Shoes-AWS](https://github.com/PTienhocSE/Kicks-Shoes-AWS)
- **Tài liệu Evidence Pack Tuần trước:** [W5 Evidence Pack](../week5/W5_evidence.md)

| Item | Value |
|------|-------|
| AWS Account ID | [account-id] |
| Region | us-east-1 |
| VPC ID | vpc-xxxxxxxx |
| ECS Cluster | kicks-shoes-dev-tientp-cluster |
| App URL | https://[cloudfront-domain].cloudfront.net |

### Lược sử Dự án (Project Recap)

**Application:** Kicks Shoes — Nền tảng E-commerce bán giày thể thao và thời trang phong cách sống.
**Business domain:** B2C retail với tích hợp Trợ lý AI tư vấn sản phẩm (Bedrock RAG), và kiến trúc hướng dịch vụ.
**Kiến trúc xuyên suốt (W1–W5):**
- **W1/W2:** Hạ tầng mạng 3-tier (ALB → ECS Fargate), lưu trữ S3 (bảo mật Block Public Access), và IAM least-privilege.
- **W3/W4:** Tích hợp DynamoDB lưu lịch sử chat, Lambda bedrock-chat xử lý LLM, Bedrock Knowledge Base RAG đa luồng.
- **W5:** Gia cố mạng (Network Fortress) với Multi-VPC/Multi-AZ, Network Firewall (Domain allowlist), VPC Flow Logs, hệ thống chia sẻ tệp EFS, HTTP API Gateway bảo vệ bởi JWT Authorizer và hệ thống hàng chờ cô lập lỗi SQS DLQ.

**Tối ưu W6:** Lớp Vận Hành (Cost Visibility, Cost Action, Monitoring, Self-Healing Security).

### W5 Feedback → W6 Fixes Applied

Dựa trên phản hồi từ trainer tuần trước, nhóm đã khắc phục triệt để các lỗ hổng:
1. **Network Firewall (Single-AZ → Multi-AZ):** Chuyển endpoint từ public subnet sang 2 intra subnets chuyên dụng trên 2 AZ (us-east-1a, us-east-1b) để triệt tiêu SPOF.
2. **MH5 DLQ Payload:** Bắt chính xác payload thật từ DynamoDB Streams ESM chứa cờ `condition: "RetriesExhausted"` và bổ sung 3 biểu đồ CloudWatch minh chứng scaling (Throttles, DLQ Messages Sent, Init Duration p99).
3. **MH3 Backup Integrity:** Định danh lại nhãn đúng cho 3 tài nguyên (EFS, DDB main, DDB chat) và chạy lệnh `cat` trên ổ đĩa phục hồi để minh chứng dữ liệu nguyên vẹn.

---

## 2. Carry-Forward: App Running End-to-End

> ⚠️ [CHÚ Ý: BẠN CẦN CHỤP ẢNH THẬT DÁN VÀO ĐÂY]

**ECS Service RUNNING:**
[Screenshot: ECS console → kicks-shoes-dev-cluster → kicks-shoes-dev-service → Status: RUNNING, Desired: 1, Running: 1]

**ALB Target Healthy:**
[Screenshot: ALB Target Group → kicks-shoes-dev-tg → Target health: healthy]

**Live demo FE→ALB→ECS→DB:**
[Screenshot: browser UI của Kicks Shoes đang hoạt động]
[Screenshot: AI Chat đang trả lời câu hỏi tư vấn giày]

---

## 3. MH-COST-V: Cost Visibility & Attribution

### Tags trên resources (4 keys bắt buộc)
[Screenshot: ECS Service tags — Owner, Environment=dev, CostCenter=G13, Application=KicksShoes]
[Screenshot: Lambda bedrock-chat tags — 4 keys]

### Cost Allocation Tags Activated (Billing console)
[Screenshot: AWS Billing → Cost allocation tags → Owner: Active, Application: Active]

### Cost Tool: AWS Budgets & Anomaly Detection
[Screenshot: Budgets console — kicks-shoes-dev-monthly-150-cap, $150 threshold, SNS action]
[Screenshot: Cost Anomaly Detection monitor]

### Baseline Cost Breakdown (Cost Explorer)
[Screenshot: Cost Explorer → Filter: Application=KicksShoes → Group by: Service]

**Top 3 cost drivers observation:**
1. **Network Firewall** (~$0.395/h/endpoint × 2 endpoints) — Resource đắt nhất. Việc triển khai Multi-AZ nhân đôi chi phí so với Single-AZ, nhưng là bắt buộc cho môi trường Production để đảm bảo High Availability (HA) cho Egress E-commerce.
2. **ECS Fargate** (256 CPU / 512 MB) — Rất thấp, tối ưu nhất do dùng task size nhỏ nhất có thể (Smallest viable task size).
3. **ElastiCache Redis** (cache.t3.micro) — Hợp lý cho môi trường dev, phục vụ caching tốc độ cao.

*Điều bất ngờ:* Network Firewall chiếm tỷ trọng cực lớn (>80%) dù volume traffic nhỏ. 
*Tối ưu thực tiễn:* Trong môi trường Sandbox/Dev, sẽ chạy script phá hủy hoàn toàn hạ tầng (Destroy) vào ban đêm để duy trì tổng chi phí dưới mức trần **$150/tuần**.

### Tagging Strategy Document (Quy chuẩn Gắn thẻ)

**Required keys:**

| Key | Allowed values | Rule |
|-----|---------------|------|
| `Owner` | `team-lead@kicks-shoes.com` | Lowercase email, định dạng nhất quán. |
| `Environment` | `dev`, `staging`, `prod` | Không dùng `Dev`, `DEV` (phân biệt hoa thường trong Cost Explorer). |
| `CostCenter` | `G13` | Mã phòng ban / Group ID chịu chi phí. |
| `Application` | `KicksShoes` | Không dùng `kicks-shoes`, `kicksshoes`. |

**Enforcement in production:** Sử dụng AWS Config rule `required-tags` và SCP (Service Control Policy) chặn hành động `ec2:RunInstances` nếu tài nguyên được tạo thiếu bộ 4 tags bắt buộc này.

---

## 4. MH-COST-A: Cost Control & Action

### Lambda Cost Guard (Automated Cost Action)
**Logic:** Stop các máy ảo EC2/RDS mang tag `Environment=dev` nhưng bỏ quên không gắn tag ngoại lệ `keep=true`.
**IAM role:** Least-privilege — chỉ cấp quyền `ec2:StopInstances`, `ec2:DescribeInstances`, `rds:StopDBInstance`, `rds:DescribeDBInstances`. Không cấp quyền wildcard.

[Screenshot: Lambda console — function overview, runtime Python 3.12, role]
[Screenshot: IAM role policy — chỉ đúng 4 actions kể trên]

### Cơ chế kích hoạt: Daily Scheduled & Cost-Driven
[Screenshot: EventBridge Scheduler — kicks-shoes-dev-cost-guard-daily, cron(0 20 * * ? *)]
[Screenshot: AWS Budgets → SNS → Lambda Chain]

### Bằng chứng Thực thi (Demonstrated Stop)
[Screenshot: EC2 console → instance i-xxxxxxxx → State: running (Before)]
[Screenshot: CloudWatch Logs → "Stopping EC2 instance"]
[Screenshot: EC2 console → instance i-xxxxxxxx → State: stopped (After)]
[Screenshot: CloudTrail → EventName=StopInstances → userAgent contains "lambda"]

### ADR — Cost Data Latency & Budgets Trigger
**Context:** AWS cost data có độ trễ cập nhật (lag) khoảng 8–24h. Trong môi trường Sandbox workshop (thời gian sống 48h), cảnh báo Budgets dựa trên chi phí sẽ **KHÔNG** kịp kích hoạt do không đủ thời gian tích lũy cost data.
**Decision:** Xây dựng toàn bộ luồng kết nối (Budgets $150 → SNS → Lambda). Kịch bản Demo được thực hiện bằng cách đẩy (publish) một test message thủ công vào SNS Topic để kích hoạt Lambda Stop EC2. 
**Production behavior:** Trong môi trường Prod thực tế, Budgets trigger sẽ tự kích hoạt sau 8-24h khi AWS chốt số cost data. Scheduled trigger (20:00 UTC hàng ngày) đóng vai trò là cơ chế dọn dẹp chính (Primary mechanism) cho môi trường Dev.

---

## 5. MH-OBS: CloudWatch Observability

### CloudWatch Dashboard
[Screenshot: Dashboard kicks-shoes-dev-operations — hiển thị các widget có số liệu thật]

**Widget 1 — Custom Metric (Nổi bật nhất):**
- Title: **"Bedrock Query Latency (Custom Metric)"**
- Namespace: `KicksShoes/Operations`
- Metric: `BedrockQueryLatencyMs`
- Kịch bản: Đo thời gian phản hồi thực tế của LLM phục vụ khách hàng.

**Widget 2, 3, 4 — Standard Metrics:**
- ECS CPU Utilization (`AWS/ECS`)
- Lambda Errors (`AWS/Lambda`)
- API Gateway 4XX Errors (`AWS/ApiGateway`)

### Mã nguồn Publish Custom Metric
```javascript
// backend/lambda/bedrock-chat/index.js
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
// Gọi Publish sau mỗi truy vấn Bedrock thành công:
await publishMetric('BedrockQueryLatencyMs', responseTime);
```

### CloudWatch Alarm & Log Insights
[Screenshot: Alarm kicks-shoes-dev-lambda-errors state = **OK** hoặc **ALARM** (Tuyệt đối không phải INSUFFICIENT_DATA)]

**Saved Query Log Insights:**
- **Query Name:** `kicks-shoes-lambda-error-spikes`
- **Log Group:** `/aws/lambda/kicks-shoes-dev-bedrock-chat`
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as error_count by bin(5m)
| sort @timestamp desc
| limit 20
```
[Screenshot: Log Insights kết quả chạy ra >= 5 dòng lỗi timestamps thật]

---

## 6. MH-SEC: Self-Healing Security Guard

### Phân tích Đe dọa (Security Threat Paragraph)
**Misconfiguration guarded:** S3 Uploads Bucket bị tắt chế độ Block Public Access.
**Blast radius (Phạm vi ảnh hưởng):** Toàn bộ hình ảnh sản phẩm và nội dung người dùng tải lên (nếu có PII) sẽ bị phơi bày công khai. Kẻ tấn công có thể rà quét (enumerate) bucket, tải trộm dữ liệu, dẫn đến vi phạm GDPR. Hơn nữa, URL của bucket có thể bị lạm dụng để phân phối mã độc giả mạo tên miền uy tín của công ty.
**Auto-remediation time:** Dưới 1 phút sau khi vi phạm xảy ra (Thông qua EventBridge bắt tín hiệu tức thì từ CloudTrail).

### Auto-Remediation Loop (Detect &rightarrow; Fix)
**Logic Lambda:** Quét S3 bucket, nếu Block Public Access = OFF &rightarrow; gọi API `PutPublicAccessBlock` ép bật lên lại (ON). Role least-privilege chỉ có 3 quyền S3 liên quan, không dùng wildcard.

**Bằng chứng vòng lặp tự sửa lỗi:**
1. [Screenshot: S3 console → Permissions → Block Public Access: **OFF** (Đỏ - Trạng thái nguy hiểm)]
2. [Screenshot: CloudWatch Logs → "VIOLATION: Bucket kicks-shoes... has public access enabled. Remediating..."]
3. [Screenshot: S3 console → Permissions → Block Public Access: **ON** (Xanh lục - Đã được Lambda tự động fix)]
4. [Screenshot: CloudTrail → EventName=**PutPublicAccessBlock** do userAgent chứa "lambda" thực hiện]

### Lớp phòng vệ hỗ trợ (Supporting Preventive Control) — KMS CMK
Hệ thống sử dụng khóa Customer Managed Key (CMK) Symmetric để mã hóa tĩnh cho S3 Uploads thay vì xài key mặc định của AWS.
- **Key alias:** `alias/kicks-shoes-dev-s3-uploads`
- **Applied to:** S3 bucket properties -> Default encryption (SSE-KMS)

[Screenshot: KMS console → Customer managed keys → kicks-shoes-dev-s3-uploads → Key rotation: Enabled]
[Screenshot: CloudTrail → Event history → EventName=**kms:GenerateDataKey** → userAgent=s3.amazonaws.com]

### Security-Cost Trade-off (Đánh đổi Bảo mật và Chi phí)
**Chi phí:** Khóa KMS CMK tiêu tốn $1/tháng/key cộng thêm $0.03 cho mỗi 10.000 API calls (`kms:Decrypt` / `kms:GenerateDataKey`).
**Giải trình (Justified):** Chi phí này là hoàn toàn xứng đáng và mang tính bắt buộc (compliance requirement). Bởi vì khi dùng CMK, mọi lệnh giải mã file trên S3 đều ghi lại audit trail vào CloudTrail kèm theo danh tính IAM Principal và Timestamp. Khi xảy ra sự cố rò rỉ dữ liệu, việc truy vết (forensics) ai đã giải mã file nào là khả năng sống còn mà key mặc định (SSE-S3) không thể cung cấp được. Mức giá $1/tháng là không đáng kể so với lợi ích bảo vệ uy tín thương hiệu E-commerce.
