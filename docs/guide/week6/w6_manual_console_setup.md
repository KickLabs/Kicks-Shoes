# Hướng dẫn Cấu hình & Demo Thủ công trên AWS Console (Tuần 6)

> **Mục tiêu:** Thực hiện các cấu hình không thể tự động hóa bằng Terraform (Billing, Tag Activation) và thực hiện các bước demo thực tế (EC2 stop, S3 public block, CloudWatch state change) để chụp ảnh evidence nộp bài.
> 
> 👉 Quay lại: [Cẩm nang tổng README.md](./README.md) | [Nền tảng w6_foundations.md](./w6_foundations.md)

---

## 🗺️ Bản đồ các bước thủ công trên Console

| Thứ tự | Service | Hành động | Mục đích | Thời gian phản hồi |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Billing** | Activate Cost Allocation Tags | Kích hoạt tag `Owner`, `Application`, `CostCenter` | **24 giờ** để hiển thị |
| **2** | **Billing** | Enable Cost Explorer | Bật biểu đồ phân tích chi phí (nếu tài khoản mới) | **Ngay lập tức** (hoặc 24h data) |
| **3** | **Billing** | Create Cost Anomaly Monitor | ML quét hóa đơn bất thường, gửi cảnh báo | **Ngay lập tức** |
| **4** | **EC2 + Lambda** | Launch EC2 test + Invoke cost-guard | Demo tính năng tự động tắt máy dev để lấy log | **30 giây** |
| **5** | **S3 + CloudWatch** | Disable BPA S3 + Inspect auto-fix | Demo tính năng tự động khóa S3 Public | **10 - 60 giây** |
| **6** | **CloudWatch** | Generate traffic / Invoke Bedrock | Xóa trạng thái `INSUFFICIENT_DATA` của Alarm | **5 - 10 phút** |
| **7** | **CloudWatch** | Logs Insights -> Save Query | Lưu câu lệnh truy vấn log để mentor kiểm tra | **Ngay lập tức** |

---

## 1. Kích hoạt Cost Allocation Tags (Bắt buộc - Làm ngay ngày đầu)

> [!IMPORTANT]
> Terraform chỉ dán nhãn (tag) lên resource. AWS **không** tự lấy các nhãn đó để tính tiền trừ khi bạn kích hoạt chúng trong Billing Console. 
> Phải kích hoạt ngay vì dữ liệu chi phí theo tag **chỉ bắt đầu ghi nhận từ lúc bạn Activate**, không hồi tố về trước.

### 👣 Các bước thực hiện:
1. Đăng nhập vào AWS Console với **tài khoản Root** hoặc **IAM User có quyền Billing** (Admin).
2. Trên thanh tìm kiếm, gõ **Billing** và chọn dịch vụ **AWS Billing**.
3. Ở menu bên trái, cuộn xuống phần **Cost organization** -> Chọn **Cost allocation tags**.
4. Chọn tab **User-defined cost allocation tags**.
5. Trong thanh tìm kiếm của bảng, gõ lần lượt các từ khóa:
   - `Owner`
   - `Application`
   - `CostCenter`
6. Tích chọn ô vuông bên cạnh 3 tag này.
7. Click nút **Activate** ở góc trên bên phải bảng.
8. Trạng thái (Status) của chúng sẽ chuyển từ `Inactive` sang `Active`.

> [!WARNING]
> Sau khi kích hoạt, bạn phải chờ **khoảng 24 giờ** để AWS xử lý dữ liệu. Sau đó, khi vào **Cost Explorer**, bạn mới có thể chọn Filter theo Tag: `Application = KicksShoes`.

---

## 2. Kích hoạt AWS Cost Explorer

> [!NOTE]
> Trên các tài khoản AWS mới lập hoặc tài khoản Sandbox, Cost Explorer có thể chưa được bật mặc định.

### 👣 Các bước thực hiện:
1. Truy cập **AWS Billing** Console.
2. Ở menu bên trái, dưới phần **Cost analysis**, click chọn **Cost Explorer**.
3. Nếu bạn thấy màn hình chào mừng kèm nút **Launch Cost Explorer** hoặc **Enable**:
   - Click **Enable / Launch**.
   - AWS sẽ hiển thị thông báo quá trình kích hoạt đang diễn ra và có thể mất tới 24 giờ để hiển thị dữ liệu chi phí ban đầu.

---

## 3. Tạo Cost Anomaly Detection Monitor (Tăng điểm cộng)

> [!TIP]
> Cost Anomaly Detection sử dụng Machine Learning để phát hiện sự gia tăng chi phí bất thường (ví dụ: bị hack chạy tool đào coin hoặc quên tắt cụm ECS gây tăng $100 chỉ sau 1 đêm).

### 👣 Các bước thực hiện:
1. Tại **AWS Billing** Console -> Menu bên trái chọn **Cost Anomaly Detection** (dưới mục **Cost analysis**).
2. Chọn tab **Monitors** -> Click **Create monitor**.
3. Cấu hình Monitor:
   - **Monitor type:** Chọn `AWS service` (Quét theo dịch vụ - đơn giản và bao quát nhất) hoặc `Cost category / Tag` (Chọn `Application` và giá trị `KicksShoes`).
   - **Monitor name:** Đặt tên `kicks-shoes-dev-cost-anomaly-monitor`.
4. Click **Next**.
5. Cấu hình Alert subscription (Nhận cảnh báo):
   - **Subscription name:** `kicks-shoes-cost-anomaly-subscription`.
   - **Threshold:** Chọn `10 USD` (Nếu chi phí tăng bất thường vượt $10, gửi cảnh báo ngay).
   - **Alert frequency:** Chọn `Daily summary` hoặc `Immediate` (Khuyên dùng `Immediate` qua SNS).
   - **Alert recipient:** Chọn **SNS topic** và chọn ARN của topic `alerts` mà Terraform đã tạo (ví dụ: `arn:aws:sns:us-east-1:xxxxxx:kicks-shoes-dev-tientp-alerts`).
6. Click **Create monitor**.

---

## 4. Demo & Kiểm thử cost-guard (Tắt EC2/RDS tự động)

> [!IMPORTANT]
> Mentor yêu cầu chứng minh `cost-guard` hoạt động bằng cách **tự động tắt một EC2 dev** không có tag miễn trừ (`keep=true`).

### 👣 Bước 4.1: Tạo EC2 Test (Giả lập môi trường Dev)
Bạn có thể tạo nhanh bằng CLI hoặc Console:
1. Vào **EC2 Console** -> **Instances** -> **Launch instances**.
2. Cấu hình instance:
   - **Name:** `w6-cost-guard-demo-instance`
   - **AMI:** Amazon Linux 2023 (Mặc định)
   - **Instance type:** `t2.micro` hoặc `t3.micro` (Free tier)
   - **Key pair:** Chọn `Proceed without a key pair` (không cần login).
3. **Cực kỳ quan trọng - Cấu hình Tags:**
   - Click vào **Advanced details** hoặc phần **Tags** ở gần cuối.
   - Thêm tag:
     - `Environment` = `dev` (Chữ thường)
     - *(Không thêm tag `keep=true`)*
4. Click **Launch instance** và đợi trạng thái chuyển sang **Running**.

### 👣 Bước 4.2: Chạy thử cost-guard Lambda để tắt máy
1. Vào **Lambda Console** -> Tìm kiếm hàm `kicks-shoes-dev-tientp-cost-guard`.
2. Chọn tab **Test**.
3. Tạo một test event mới:
   - **Event name:** `manual-demo`
   - **Template:** `hello-world` (giữ nguyên JSON rỗng `{}`)
4. Click **Save** -> Click **Test**.
5. Đợi 2-3 giây, xem phần **Execution results** (màu xanh):
   - Kiểm tra tab log output. Bạn sẽ thấy log dạng:
     `Stopping EC2 instance: i-0xxxxxxxxxxxxxx (w6-cost-guard-demo-instance)`
6. Quay lại màn hình **EC2 Instances** -> Refresh -> Bạn sẽ thấy instance `w6-cost-guard-demo-instance` đang ở trạng thái **Stopping** hoặc **Stopped**.

### 👣 Bước 4.3: Chụp ảnh evidence CloudTrail
1. Vào **CloudTrail Console** -> Menu bên trái chọn **Event history**.
2. Thiết lập bộ lọc (Lookup attributes):
   - Chọn **Event name** và gõ `StopInstances`.
3. Bạn sẽ thấy một dòng sự kiện `StopInstances`:
   - Click vào sự kiện đó.
   - Kiểm tra trường **User name** hoặc **Event source**: Nó sẽ chỉ ra rằng API này được gọi bởi IAM Role của Lambda `cost-guard` (ví dụ: `kicks-shoes-dev-tientp-cost-guard-role`).
4. **Chụp ảnh màn hình này** để đưa vào `docs/W6_evidence.md`.

---

## 5. Demo & Kiểm thử security-guard (Tự khóa S3 Public Access)

> [!CAUTION]
> Bước này giả lập lỗi cấu hình nghiêm trọng: tắt tính năng Block Public Access của bucket chứa ảnh giày. **security-guard** phải tự phát hiện và kích hoạt lại ngay lập tức.

### 👣 Bước 5.1: Cố tình phá cấu hình an toàn (Tạo lỗ hổng)
1. Vào **S3 Console** -> Tìm và chọn bucket uploads: `kicks-shoes-dev-tientp-xxxxxx-uploads`.
2. Chọn tab **Permissions**.
3. Tại phần **Block public access (bucket settings)** -> Click **Edit**.
4. **Bỏ tích** ô **Block *all* public access** (làm xuất hiện cảnh báo màu đỏ nguy hiểm).
5. Click **Save changes**.
6. Gõ chữ `confirm` vào ô xác nhận -> Click **Confirm**.
7. Bây giờ, trạng thái hiển thị của bucket sẽ là **Objects can be public** (màu vàng cảnh báo).

### 👣 Bước 5.2: Tự động hồi phục (Self-Healing)
Hệ thống sử dụng EventBridge Rule bắt sự kiện từ CloudTrail để gọi Lambda `security-guard` sửa lỗi.
1. Chờ khoảng **10 đến 30 giây** (Thời gian CloudTrail ghi event và EventBridge kích hoạt).
2. F5/Refresh lại trang **Permissions** của S3 bucket đó trên Console.
3. Trạng thái của **Block public access** phải tự động quay trở lại **Block *all* public access** (Tất cả 4 ô kiểm đều được tích chọn `ON`).
4. Nếu chờ lâu (> 2 phút) do độ trễ CloudTrail ở một số tài khoản Sandbox, bạn có thể trigger thủ công bằng cách:
   - Vào **Lambda Console** -> `kicks-shoes-dev-tientp-security-guard`.
   - Chọn tab **Test** -> Click **Test** (với payload `{}`).
   - Lambda sẽ quét toàn bộ bucket và bật lại BPA ngay lập tức.

### 👣 Bước 5.3: Chụp ảnh evidence CloudTrail
1. Vào **CloudTrail Console** -> **Event history**.
2. Thiết lập bộ lọc:
   - Chọn **Event name** và gõ `PutPublicAccessBlock`.
3. Click vào event gần nhất:
   - Xem chi tiết JSON. Bạn sẽ thấy **User Identity** gọi lệnh này chính là IAM Role của Lambda `security-guard`.
4. **Chụp ảnh màn hình này** cùng với ảnh S3 bucket Permissions đã được khóa lại.

---

## 6. Xóa trạng thái INSUFFICIENT_DATA của CloudWatch Alarms

> [!WARNING]
> Khi nộp bài vào thứ Sáu, các Alarm trên CloudWatch **bắt buộc** phải ở trạng thái `OK` hoặc `ALARM`. Nếu để `INSUFFICIENT_DATA`, mentor sẽ coi như bạn chưa cấu hình hoặc cấu hình lỗi và **trừ điểm**.

### 👣 Cách đẩy dữ liệu để Alarm hoạt động:

#### A. Đối với Alarm CPUUtilization của ECS:
1. Truy cập Frontend URL của bạn (ví dụ: `https://d652dbdxs95hf.cloudfront.net`).
2. F5 liên tục, click xem sản phẩm, tạo tài khoản, đăng nhập.
3. Nếu muốn tăng tải nhanh để vẽ đồ thị: Chạy lệnh gọi API liên tục từ Terminal máy cá nhân:
   ```powershell
   for ($i=1; $i -le 100; $i++) { curl -s https://dlcjow973n7gl.cloudfront.net/api/health; Write-Host "Request $i" }
   ```

#### B. Đối với Alarm Bedrock Latency / Errors (Custom Metric):
Do custom metric chỉ được đẩy lên khi người dùng chat với Bedrock, bạn cần gọi API Bedrock ít nhất vài lần:
1. Đăng nhập vào Frontend -> Vào mục Chatbot AI.
2. Gửi từ 5-10 câu hỏi để Bedrock xử lý.
3. Hoặc gọi trực tiếp Lambda `bedrock-chat` từ AWS Console:
   - Vào **Lambda Console** -> `kicks-shoes-dev-tientp-bedrock-chat`.
   - Chọn tab **Test** -> Điền payload giả lập:
     ```json
     {
       "body": "{\"message\":\"Hãy gợi ý cho tôi 3 đôi giày chạy bộ tốt nhất\"}"
     }
     ```
   - Click **Test** 5 lần liên tiếp.

#### C. Xác minh trên CloudWatch:
1. Vào **CloudWatch Console** -> **Alarms** -> **All alarms**.
2. Kiểm tra cột **State**: Trạng thái của `kicks-shoes-dev-tientp-lambda-errors` và `kicks-shoes-dev-tientp-bedrock-latency-high` phải đổi từ `Insufficient data` sang **OK** (hoặc **ALARM** nếu bạn cố tình tạo lỗi).
3. **Chụp ảnh màn hình** danh sách Alarm sạch đẹp không có dòng màu xám `Insufficient data`.

---

## 7. Lưu câu truy vấn Logs Insights trên Console

> [!TIP]
> Lưu câu truy vấn (Saved Queries) giúp bạn dễ dàng chạy lại khi demo trực tiếp với mentor mà không cần gõ lại code.

### 👣 Các bước thực hiện:
1. Vào **CloudWatch Console** -> Menu bên trái chọn **Logs** -> **Logs Insights**.
2. Chọn Log group từ ô tìm kiếm:
   - Ví dụ: `/aws/apigateway/kicks-shoes-dev-tientp-bedrock-api` (API Gateway)
   - Hoặc: `/aws/lambda/kicks-shoes-dev-tientp-bedrock-chat` (Lambda Bedrock)
3. Dán câu query mẫu sau vào khung soạn thảo:
   ```query
   fields @timestamp, ip, httpMethod, routeKey, status, responseLatency
   | filter status >= 400 or responseLatency > 1000
   | sort responseLatency desc
   | limit 20
   ```
4. Click **Run query** để đảm bảo query trả về kết quả (phải có dữ liệu ECS/API Gateway chạy trước đó).
5. Click nút **Queries** ở góc trên bên phải -> Chọn **Save query**.
6. Thiết lập thông tin lưu:
   - **Query name:** `W6_Slow_Requests_Filter`
   - **Log group association:** Tích chọn log group hiện tại để lần sau mở ra tự động chọn đúng log.
7. Click **Save**.
8. Lần sau, bạn chỉ cần click **Queries** -> **Saved queries** -> Chọn `W6_Slow_Requests_Filter` để chạy. Chụp lại ảnh màn hình danh sách query đã lưu làm bằng chứng.

---

## 8. Kiểm tra cấu hình Encryption KMS CMK của S3 Bucket

1. Vào **S3 Console** -> Click vào bucket `kicks-shoes-dev-tientp-xxxxxx-uploads`.
2. Chọn tab **Properties**.
3. Cuộn xuống phần **Default encryption**:
   - Trạng thái phải hiển thị: **Enabled**.
   - Encryption type: **Server-side encryption with AWS Key Management Service keys (SSE-KMS)**.
   - KMS key: Phải hiển thị ARN hoặc Alias trỏ đúng tới Customer Managed Key được tạo bởi Terraform (ví dụ: `aws/kms` -> chọn custom key `kicks-shoes-dev-tientp-s3-uploads`).
4. **Chụp ảnh màn hình** phần Properties này làm bằng chứng cho phần bảo mật dữ liệu (MH-SEC).

---

> [!NOTE]
> Sau khi hoàn tất các bước trên, hãy cập nhật các hình ảnh chụp được vào file [docs/W6_evidence.md](../W6_evidence.md) (hoặc file evidence tương đương trong repo của bạn) và chuẩn bị cho buổi nghiệm thu!
