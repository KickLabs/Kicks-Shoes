# Cẩm nang AWS Tuần 6 — Operations Hardening & Cost-Aware Cloud

> **Deadline:** Thứ Sáu 22-05-2026 | **Budget cap:** $150 tuyệt đối  
> **Nguyên tắc:** *Demonstrable, not documented* — phải chứng minh bằng screenshot, CloudTrail, alarm state, không chỉ mô tả.

Tuần 6 **không thêm tính năng mới**. Mục tiêu: chứng minh stack W1–W5 **vận hành được** — biết chi phí, kiểm soát chi phí, quan sát được, tự sửa lỗi bảo mật.

---

## 🎓 Bạn mất gốc? Đọc theo thứ tự này

| Thứ tự | File | Mục đích |
|:------:|------|----------|
| **0** | **[w6_foundations.md](./w6_foundations.md)** | AWS tính tiền thế nào, 4 MH là gì, EC2 vs Lambda, FAQ — **bắt buộc nếu chưa làm W5** |
| 1 | File này (README) | Bản đồ tổng + URL deploy |
| 2 | [w6_must_haves_mapping.md](./w6_must_haves_mapping.md) | Làm COST-V + COST-A (có giải thích code từng bước) |
| 3 | [w6_must_haves_part2.md](./w6_must_haves_part2.md) | Làm OBS + SEC + Evidence |
| 4 | **[w6_manual_console_setup.md](./w6_manual_console_setup.md)** | **Cấu hình thủ công & demo chi tiết trên AWS Console (Kích hoạt tags, demo EC2/S3, Alarms)** |
| 5 | [w6_full_knowledge_part1.md](./w6_full_knowledge_part1.md) | Ôn sâu / mọi path Cost |
| 6 | [w6_full_knowledge_part2.md](./w6_full_knowledge_part2.md) | Ôn sâu / mọi path OBS & SEC |

> **Đã có kinh nghiệm AWS / đã làm W5:** Bỏ bước 0, đọc README → must_haves.

---

## Danh sách tài liệu (đầy đủ)

| File | Nội dung | Đối tượng |
|------|----------|-----------|
| [w6_foundations.md](./w6_foundations.md) | Nền tảng zero-to-hero | Người mới / mất gốc |
| [w6_must_haves_mapping.md](./w6_must_haves_mapping.md) | Glossary, MH-COST-V, MH-COST-A + demo | Làm bài thực hành |
| [w6_must_haves_part2.md](./w6_must_haves_part2.md) | MH-OBS, MH-SEC, FE/BE, Evidence | Làm bài thực hành |
| [w6_manual_console_setup.md](./w6_manual_console_setup.md) | Hướng dẫn cấu hình thủ công & demo từng bước trên Console | Hướng dẫn thực hành & chụp ảnh evidence |
| [w6_full_knowledge_part1.md](./w6_full_knowledge_part1.md) | 100% kiến thức Cost (mọi path) | Ôn thi / mentor hỏi sâu |
| [w6_full_knowledge_part2.md](./w6_full_knowledge_part2.md) | 100% kiến thức OBS & SEC | Ôn thi / mentor hỏi sâu |

---

## 4 Must-Haves W6 (tóm tắt + ví von)

| MH | Tên | Làm gì (một câu) | Ví von |
|----|-----|------------------|--------|
| **MH-COST-V** | Cost Visibility | Gắn nhãn + xem bill + Budget cảnh báo | Nhãn vali + sao kê + còi báo 80% hạn mức |
| **MH-COST-A** | Cost Control | Robot tắt EC2/RDS dev mỗi tối / khi SNS báo | Timer tắt đèn + tắt máy khi hóa đơn cao |
| **MH-OBS** | Monitoring | Đồ thị latency, CPU, lỗi + chuông báo | Camera + đồng hồ đo + chuông cửa |
| **MH-SEC** | Self-Healing Security | Robot khóa lại S3 nếu bị mở public | Khóa cửa kho tự khóa khi ai đó mở |

---

## Stack đã deploy (us-east-1 — tham chiếu)

| Thành phần | Giá trị | Dùng để làm gì (W6) |
|------------|---------|---------------------|
| Account | `962533717758` | Evidence cover |
| Region | `us-east-1` | Mọi CLI/console |
| Frontend | `https://d652dbdxs95hf.cloudfront.net` | Demo E2E, generate traffic |
| Backend API | `https://dlcjow973n7gl.cloudfront.net/api` | `VITE_API_BASE_URL` |
| API Gateway (Bedrock) | `https://tzvjf3doba.execute-api.us-east-1.amazonaws.com` | `VITE_BEDROCK_API_URL` |
| ECS cluster | `kicks-shoes-dev-tientp-cluster` | Alarm CPU, health check |
| Cost Guard Lambda | `kicks-shoes-dev-tientp-cost-guard` | MH-COST-A |
| Security Guard Lambda | `kicks-shoes-dev-tientp-security-guard` | MH-SEC |
| Budget | `kicks-shoes-dev-tientp-monthly-150-cap` | MH-COST-V/A |
| Dashboard | `kicks-shoes-dev-tientp-operations` | MH-OBS |

---

## Lộ trình theo ngày (khuyến nghị)

| Ngày | Việc | File hỗ trợ |
|------|------|-------------|
| Thứ 2 | Đọc foundations + redeploy + tags + activate allocation tags | w6_foundations, mapping §1 |
| Thứ 3 | cost-guard demo EC2 + SNS test + ADR | mapping §2 |
| Thứ 4 | security-guard demo S3 + KMS CloudTrail | part2 §4 |
| Thứ 5 | Metric data + Log Insights + evidence.md | part2 §3, §6 |
| Thứ 6 sáng | Alarm ≠ INSUFFICIENT_DATA, nộp Slack | part2 §7 |

---

## File Terraform / Lambda W6

```
infra/terraform/environments/dev/02-app/
├── budgets.tf          # MH-COST-A: Budget $150 → SNS
├── cost-guard.tf       # MH-COST-A: Lambda + Scheduler + SNS sub
├── monitoring.tf       # MH-OBS: Dashboard + alarms
├── security-guard.tf   # MH-SEC: Lambda + EventBridge
├── kms.tf              # MH-SEC: CMK S3 uploads
├── api-gateway.tf      # MH-OBS: access log format
└── variables.tf        # MH-COST-V: Owner, CostCenter, Application

backend/lambda/
├── cost-guard/index.py      # → build cost-guard.zip trước apply
└── security-guard/index.py  # → build security-guard.zip trước apply
```

---

## Công cụ cần cài (checklist môi trường)

- [ ] AWS CLI + `aws configure` (account workshop)
- [ ] Terraform >= 1.0
- [ ] PowerShell (Windows) hoặc bash
- [ ] Quyền IAM: EC2, Lambda, Budgets, CloudWatch, S3, KMS (dev account)

---

## Liên kết AIDD

Chi tiết implementation + template evidence: `.AIDD/changes/003-w6-operations-hardening/`
