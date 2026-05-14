# Cẩm nang AWS Tuần 5 — Phần 1: Thuật ngữ, MH1 & MH2

> Tài liệu chia làm 2 phần để dễ đọc. Phần 1 bao gồm **Bảng Thuật Ngữ**, **MH1 (VPC Flow Logs)** và **MH2 (Network Firewall)**.
> 👉 [Xem Phần 2: MH3, MH4, MH5](file:///C:/Users/phuct/.gemini/antigravity/brain/9bca45c4-0841-49b0-911d-a9ad75c79595/w5_must_haves_part2.md)

---

## 📖 Bảng Định Nghĩa Thuật Ngữ AWS (Glossary)

Trước khi đi vào chi tiết, hãy nắm vững các khái niệm cơ bản:

| Thuật ngữ | Định nghĩa dễ hiểu | Ví dụ thực tế |
| :--- | :--- | :--- |
| **VPC (Virtual Private Cloud)** | Một mạng ảo riêng biệt trên AWS, giống như **tòa nhà văn phòng riêng** của bạn trên đám mây. Mọi tài nguyên (server, database) đều nằm bên trong tòa nhà này. | `vpc-09081a6d16101c684` |
| **Subnet** | Phân khu/tầng bên trong tòa nhà VPC. Có 3 loại chính: **Public** (tầng có cửa ra đường), **Private** (tầng hầm kín), **Intra** (tầng kiểm duyệt đặc biệt). | `subnet-0cc0d6ec2dd61f93b` |
| **Route Table** | **Bản đồ chỉ đường** cho từng tầng. Quy định: "Muốn đi ra Internet thì rẽ phải qua cổng NAT Gateway" hoặc "Muốn ra ngoài thì phải qua Trạm kiểm lâm Firewall trước". | `rtb-0353b4cb12b03f330` |
| **NAT Gateway** | **Cổng trung gian** cho phép máy chủ ở tầng hầm (Private Subnet) gọi ra Internet nhưng không cho ai từ ngoài gọi ngược vào. Như cánh cửa một chiều. | `nat-0512e0f0ba5b9861f` |
| **Security Group** | **Bảo vệ cá nhân** đứng ngay trước cửa phòng mỗi server. Quy định ai (IP nào, Port nào) được vào, ai bị chặn. | `sg-07d36aecb1b58788e` |
| **IAM Role** | **Thẻ nhân viên** cấp quyền cho một dịch vụ AWS. Ví dụ: cấp thẻ cho Camera (Flow Log) để nó được quyền viết vào Sổ nhật ký (CloudWatch). | `kicks-shoes-dev-tientp-vpc-flow-logs-role` |
| **CloudWatch Logs** | **Kệ sách lưu trữ nhật ký** trung tâm trên AWS. Mọi log từ Camera, Tường lửa, Lambda đều ghi vào đây. | `/vpc/kicks-shoes-dev-tientp/flow-logs` |
| **ECS Fargate** | Dịch vụ chạy container **không cần quản lý server vật lý**. AWS lo hết phần cứng, bạn chỉ cần đóng gói code vào container rồi chạy. | `kicks-shoes-dev-tientp-service` |
| **EFS (Elastic File System)** | **Ổ cứng mạng dùng chung** có thể gắn vào nhiều container cùng lúc. File không bị mất khi container tắt/khởi động lại. | `fs-07bb685d649bcce04` |
| **Lambda** | **Hàm chạy tự động** trên AWS. Bạn chỉ viết code, AWS lo môi trường chạy. Chỉ tính tiền khi code thực sự chạy (tính theo mili-giây). | `kicks-shoes-dev-tientp-bedrock-chat` |
| **API Gateway** | **Cổng vào HTTP** cho các dịch vụ backend. Quản lý route, xác thực, giới hạn tốc độ tự động. | `tihs825aph.execute-api.us-east-1.amazonaws.com` |
| **DynamoDB** | Cơ sở dữ liệu NoSQL **phi máy chủ** của AWS. Tự động mở rộng, không cần cài đặt hay quản trị server database. | `kicks-shoes-dev-tientp-chat-messages` |
| **DynamoDB Streams** | Luồng sự kiện tự động phát sinh mỗi khi có dữ liệu mới ghi vào bảng DynamoDB. Dùng để kích hoạt Lambda xử lý ngầm. | — |
| **SQS (Simple Queue Service)** | **Hàng đợi tin nhắn** phi máy chủ. Dùng để truyền thông điệp giữa các dịch vụ một cách tin cậy. | `kicks-shoes-dev-tientp-bedrock-dlq` |
| **Dead-Letter Queue (DLQ)** | Hàng đợi SQS đặc biệt chuyên **chứa các tin nhắn bị lỗi** không xử lý được sau nhiều lần thử lại. | — |
| **AWS Backup** | Dịch vụ **sao lưu tự động** tập trung. Lập lịch chụp Snapshot cho EFS, DynamoDB, RDS, v.v. theo chu kỳ. | `kicks-shoes-dev-tientp-backup-vault` |
| **Network Firewall** | **Tường lửa cấp doanh nghiệp** của AWS. Kiểm tra và lọc traffic ra/vào VPC dựa trên quy tắc domain, IP, giao thức. | `kicks-shoes-dev-tientp-firewall` |
| **Terraform** | Công cụ **Infrastructure as Code (IaC)**. Viết code (file `.tf`) để khai báo hạ tầng AWS, thay vì click tay trên Console. | Tất cả file `.tf` trong dự án |
| **JWT (JSON Web Token)** | **Vé thông hành số** chứa thông tin người dùng đã đăng nhập, được mã hóa bằng chữ ký bí mật (`JWT_SECRET`). | Token trong header `Authorization: Bearer ...` |

---

## 1. MH1 — VPC Flow Logs (Camera An Ninh Mạng)

### 📚 Định nghĩa
**VPC Flow Logs** là tính năng của AWS cho phép **ghi lại metadata** (siêu dữ liệu) của mọi gói tin IP đi qua các giao diện mạng (ENI) trong VPC. Nó KHÔNG đọc nội dung gói tin mà chỉ ghi nhận: IP nguồn, IP đích, Port, Giao thức, Kích thước, và Kết quả (ACCEPT/REJECT).

### 🎯 Mục đích
* Phát hiện sớm **hành vi rà quét cổng** (Port Scanning) từ IP lạ.
* Cung cấp **bằng chứng pháp y** khi xảy ra sự cố bảo mật hoặc nghẽn mạng.
* Theo dõi luồng traffic để **tối ưu hóa kiến trúc mạng**.

### 💻 Code Terraform đã cấu hình — Giải thích từng dòng

**File:** [01-network/main.tf](file:///d:/Workspace/Study/AWS/Kicks-Shoes-AWS/infra/terraform/environments/dev/01-network/main.tf)

**Bước 1 — Tạo nơi lưu trữ nhật ký (CloudWatch Log Group):**
```hcl
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  # Tên quyển sổ nhật ký trên kệ CloudWatch
  name              = "/vpc/${var.project_name}/flow-logs"
  # Giữ nhật ký bao lâu? 7 ngày rồi tự động xóa (tiết kiệm tiền lưu trữ)
  retention_in_days = 7
  tags              = local.common_tags
}
```

**Bước 2 — Tạo Thẻ nhân viên (IAM Role) cho Camera:**
```hcl
resource "aws_iam_role" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-role"
  # Chính sách tin cậy: Chỉ có dịch vụ "vpc-flow-logs.amazonaws.com" mới được dùng thẻ này
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
    }]
  })
}
```

**Bước 3 — Cấp quyền viết nhật ký cho Camera:**
```hcl
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "${var.project_name}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id
  # Cho phép Camera tạo log stream và ghi sự kiện vào CloudWatch
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}
```

**Bước 4 — Bật Camera và gắn vào VPC:**
```hcl
resource "aws_flow_log" "vpc" {
  # Gắn camera vào VPC nào? VPC chính của dự án
  vpc_id          = module.vpc.vpc_id
  # Ghi hình loại traffic nào? "ALL" = Cả xe được vào (ACCEPT) và xe bị đuổi (REJECT)
  traffic_type    = "ALL"
  # Thẻ bảo vệ để Camera có quyền viết log
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  # Quyển sổ nhật ký đặt ở đâu
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
}
```

### 🖥️ Cách xem trên AWS Console
1. Đăng nhập **AWS Console** → Tìm dịch vụ **VPC** (gõ "VPC" trên thanh tìm kiếm).
2. Menu bên trái chọn **Your VPCs** → Click vào VPC `kicks-shoes-dev-tientp-vpc`.
3. Chọn tab **Flow logs** → Bạn sẽ thấy Flow Log đang Active, trỏ đến CloudWatch Log Group.
4. Muốn đọc nội dung log? Mở dịch vụ **CloudWatch** → **Logs** → **Log groups** → Tìm `/vpc/kicks-shoes-dev-tientp/flow-logs` → Click vào **Log streams** để xem các bản ghi chi tiết.

---

## 2. MH2 — Network Firewall (Pháo Đài Mạng)

### 📚 Định nghĩa
**AWS Network Firewall** là dịch vụ tường lửa quản lý cấp doanh nghiệp, cho phép bạn **kiểm tra, lọc và chặn** traffic mạng ra/vào VPC dựa trên các quy tắc trạng thái (Stateful Rules). Nó hoạt động ở tầng mạng thấp hơn Security Group và có khả năng phân tích **tên miền (Domain Name)** của traffic.

### 📚 Định nghĩa các Khái niệm Con
| Khái niệm | Định nghĩa |
| :--- | :--- |
| **Stateful Rule** | Quy tắc "có trí nhớ". Khi cho một gói tin đi ra, tường lửa tự động nhớ và cho phép gói tin phản hồi quay về mà không cần khai báo thêm quy tắc. |
| **Allowlist** | Danh sách trắng. Chỉ những domain/IP nằm trong danh sách mới được đi qua. Mọi thứ khác đều bị chặn mặc định. |
| **TLS_SNI** | Server Name Indication — Trường trong giao thức TLS/HTTPS chứa tên miền mà client muốn kết nối. Tường lửa soi trường này để biết traffic đang đi đến domain nào mà không cần giải mã nội dung. |
| **HTTP_HOST** | Trường tiêu đề trong giao thức HTTP chứa tên miền đích. Tương tự TLS_SNI nhưng dùng cho traffic HTTP không mã hóa. |
| **Firewall Endpoint** | Điểm trung chuyển (giống trạm thu phí) được AWS tạo ra trong subnet. Mọi traffic phải đi qua điểm này để được kiểm tra. |
| **Intra Subnet** | Loại subnet đặc biệt trong module VPC Terraform, mặc định **hoàn toàn cô lập** (không có route ra Internet). Dùng để đặt Firewall Endpoint. |

### 🎯 Mục đích
* **Chống đánh cắp dữ liệu (Data Exfiltration):** Kể cả khi hacker chiếm được container, chúng không thể gửi dữ liệu khách hàng ra server của mình vì tường lửa sẽ chặn mọi domain không nằm trong Allowlist.
* **Tuân thủ quy chuẩn bảo mật:** Nhiều tiêu chuẩn (PCI-DSS, SOC2) yêu cầu bắt buộc có tường lửa lọc traffic egress.

### 💻 Code Terraform — Giải thích từng phần

**File:** [02-app/network-firewall.tf](file:///d:/Workspace/Study/AWS/Kicks-Shoes-AWS/infra/terraform/environments/dev/02-app/network-firewall.tf)

**Phần A — Khai báo Danh sách trắng (Allowlist):**
```hcl
resource "aws_networkfirewall_rule_group" "domain_allowlist" {
  capacity = 100  # Sức chứa tối đa 100 quy tắc
  name     = "${var.project_name}-domain-allowlist"
  type     = "STATEFUL"  # Quy tắc có trí nhớ (tự cho phép traffic phản hồi)

  rule_group {
    rules_source {
      rules_source_list {
        generated_rules_type = "ALLOWLIST"  # Chế độ: Chỉ CHO PHÉP domain trong list
        target_types         = ["HTTP_HOST", "TLS_SNI"]  # Soi 2 trường này trong gói tin

        # Danh sách domain được phép đi qua (Tất cả domain khác bị CHẶN)
        targets = [
          ".amazonaws.com",                    # Dịch vụ AWS (ECR pull image, S3, Secrets Manager)
          ".docker.io",                        # Docker Hub (tải container image)
          ".docker.com",                       # Docker Hub
          "generativelanguage.googleapis.com",  # Google Gemini AI API
          "api.openweathermap.org",            # Weather API
          ".mongodb.net",                      # MongoDB Atlas (Database)
          ".payos.vn",                         # PayOS (thanh toán)
          "api.vnappmob.com",                  # API tra cứu tỉnh thành Việt Nam
        ]
      }
    }
    stateful_rule_options {
      rule_order = "STRICT_ORDER"  # Xử lý quy tắc theo thứ tự ưu tiên nghiêm ngặt
    }
  }
}
```

**Phần B — Tạo Chính sách Tường lửa (Firewall Policy):**
```hcl
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "${var.project_name}-firewall-policy"

  firewall_policy {
    # Traffic không có trạng thái → Chuyển tiếp lên bộ kiểm tra trạng thái
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]

    # Gắn bộ quy tắc Allowlist đã tạo ở trên vào chính sách
    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.domain_allowlist.arn
      priority     = 1  # Ưu tiên cao nhất
    }
  }
}
```

**Phần C — Xây dựng Tường lửa & Đặt Endpoint vào Intra Subnet:**
```hcl
resource "aws_networkfirewall_firewall" "main" {
  name                = "${var.project_name}-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = local.vpc_id

  # Đặt Firewall Endpoint vào các Intra Subnet (tầng kiểm duyệt)
  dynamic "subnet_mapping" {
    for_each = data.terraform_remote_state.network.outputs.firewall_subnet_ids
    content {
      subnet_id = subnet_mapping.value
    }
  }
}
```

**Phần D — Robot Tự động Gán Đường đi (file [02-app/main.tf](file:///d:/Workspace/Study/AWS/Kicks-Shoes-AWS/infra/terraform/environments/dev/02-app/main.tf)):**
```hcl
resource "null_resource" "firewall_routing" {
  # Chạy lại mỗi khi Terraform apply để đảm bảo route luôn đúng
  triggers = {
    firewall_id = aws_networkfirewall_firewall.main.id
    timestamp   = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = <<-EOT
      # Bước 1: Hỏi AWS lấy Endpoint ID của Firewall vừa tạo
      $statusJson = (aws network-firewall describe-firewall ... | ConvertFrom-Json)
      $endpointId = $statusJson.FirewallStatus.SyncStates[0].Attachment.EndpointId

      # Bước 2: Sửa bản đồ Private Subnet → Bắt buộc đi qua Firewall
      aws ec2 replace-route --route-table-id <private-rt> \
        --destination-cidr-block 0.0.0.0/0 --vpc-endpoint-id $endpointId

      # Bước 3: Sửa bản đồ Intra Subnet → Cho Firewall đi tiếp ra NAT Gateway
      aws ec2 replace-route --route-table-id <intra-rt> \
        --destination-cidr-block 0.0.0.0/0 --nat-gateway-id <nat-gw-id>
    EOT
    interpreter = ["PowerShell", "-Command"]
  }
}
```

**Phần E — Bật Log ghi nhận các traffic bị chặn:**
```hcl
resource "aws_networkfirewall_logging_configuration" "main" {
  firewall_arn = aws_networkfirewall_firewall.main.arn
  logging_configuration {
    # Log ALERT: Ghi lại mỗi khi có traffic bị chặn (vi phạm quy tắc)
    log_destination_config {
      log_destination      = { logGroup = "/aws/network-firewall/alert/..." }
      log_destination_type = "CloudWatchLogs"
      log_type             = "ALERT"
    }
    # Log FLOW: Ghi lại tất cả luồng traffic đi qua (cả cho phép và chặn)
    log_destination_config {
      log_destination      = { logGroup = "/aws/network-firewall/flow/..." }
      log_destination_type = "CloudWatchLogs"
      log_type             = "FLOW"
    }
  }
}
```

### 🖥️ Cách xem trên AWS Console
1. Mở **AWS Console** → Tìm dịch vụ **VPC** → Menu trái chọn **Network Firewall** → **Firewalls**.
2. Click vào `kicks-shoes-dev-tientp-firewall` → Tab **Firewall details** để xem trạng thái Endpoint.
3. Chuyển sang tab **Firewall policy** → Click vào policy → Xem **Stateful rule groups** → Click vào `domain-allowlist` để xem danh sách domain được phép.
4. **Xem log bị chặn:** Mở **CloudWatch** → **Log groups** → Tìm `/aws/network-firewall/alert/kicks-shoes-dev-tientp` → Các bản ghi ở đây cho biết traffic nào đã bị Firewall từ chối.
5. **Xem Route Table:** Mở **VPC** → **Route tables** → Tìm `kicks-shoes-dev-tientp-vpc-private` → Tab **Routes** → Xác nhận route `0.0.0.0/0` trỏ đến `vpce-...` (Firewall Endpoint) chứ KHÔNG phải `nat-...`.

---

> 👉 **Tiếp tục đọc Phần 2:** [MH3, MH4, MH5 — EFS & Backup, API Gateway, SQS DLQ](file:///C:/Users/phuct/.gemini/antigravity/brain/9bca45c4-0841-49b0-911d-a9ad75c79595/w5_must_haves_part2.md)
