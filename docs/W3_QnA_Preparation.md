# Kicks Shoes - Tham Khảo Chuyên Sâu Trả Lời QnA Tuần 3 (50 Câu Hỏi Chi Tiết)

Tài liệu này cung cấp 50 câu hỏi & đáp án **chuyên sâu ở cấp độ kỹ sư Cloud thực thụ**. Mỗi đáp án không chỉ nêu "cái gì" mà còn giải thích "tại sao", "hoạt động thế nào" và "bằng chứng trong dự án Kicks Shoes là gì". Hãy sử dụng tài liệu này để bảo vệ kiến trúc của nhóm trước các Trainer vào buổi Review thứ Sáu.

---

## Phần 1: Kiến trúc Dữ liệu & Quyết định Database (Câu 1 - 15)

**1. Trong tuần 3, nhóm đã chọn mô hình Database nào và giải quyết bài toán gì?**
👉 Nhóm đã lựa chọn **Key-Value Paradigm** thông qua dịch vụ **Amazon DynamoDB**. Bài toán cốt lõi của Kicks Shoes trong tuần này là xây dựng hệ thống AI Chatbot. Hệ thống này đòi hỏi việc lưu trữ và truy xuất hàng ngàn tin nhắn theo thời gian thực (high-velocity read/write). DynamoDB với cơ chế phân vùng tự động (Auto Partitioning) giúp hệ thống duy trì độ trễ ở mức single-digit millisecond (dưới 10ms) dù quy mô dữ liệu có tăng lên hàng Terabyte.

**2. Tại sao nhóm không dùng RDS (Cơ sở dữ liệu quan hệ) cho tính năng AI Chat? (Câu hỏi bắt buộc theo Part C của Data Access Pattern Log)**
👉 Nếu dùng RDS (ví dụ Postgres/MySQL) cho hệ thống Chat với lưu lượng lên tới 10,000 writes/sec, chúng ta sẽ lập tức gặp hiện tượng "nghẽn cổ chai" ở Database Connection Pool. Bảng lưu tin nhắn sẽ phình to thành hàng trăm triệu dòng rất nhanh, khiến các lệnh JOIN hoặc Pagination (phân trang) bị suy giảm hiệu suất nghiêm trọng. Để RDS chịu được tải này, chúng ta sẽ phải tự xây dựng cơ chế Sharding (chia nhỏ DB) hoặc thiết lập Queue (hàng đợi) phía trước, làm tăng độ trễ, tăng chi phí và phức tạp hóa hệ thống. DynamoDB sinh ra để giải quyết chính xác bài toán Key-Value scale vô hạn này.

**3. Partition Key (Khóa phân vùng) trong DynamoDB của bạn được thiết kế như thế nào?**
👉 Chúng tôi sử dụng `conversation_id` làm Partition Key (PK) và `timestamp` làm Sort Key (SK). `conversation_id` là một thuộc tính có **High-Cardinality** (tính đa dạng cao). DynamoDB sử dụng giá trị hash của PK để phân phối dữ liệu vật lý ra nhiều node máy chủ khác nhau. Việc chọn một PK có độ đa dạng cao giúp tránh hiện tượng "Hot Partition" (nút cổ chai trên một phân vùng duy nhất), đảm bảo RCU (Read Capacity Units) và WCU (Write Capacity Units) được dàn đều.

**4. Sự khác biệt cốt lõi giữa lệnh Query và Scan trong DynamoDB là gì?**
👉 Lệnh **Query** sẽ nhảy trực tiếp đến một phân vùng vật lý dựa vào hàm băm của Partition Key, do đó nó chỉ đọc đúng những item cần thiết (độ phức tạp O(1) hoặc O(log N) theo Sort Key). Lệnh **Scan** sẽ đọc toàn bộ dữ liệu có trong bảng, lướt qua từng phân vùng một (độ phức tạp O(N)). Scan tiêu tốn lượng RCU khổng lồ và tốn rất nhiều tiền. Trong kiến trúc Kicks Shoes, chúng tôi **nghiêm cấm dùng Scan** trong các luồng API gọi liên tục; mọi truy vấn đều dùng Query.

**5. Nếu không dùng Scan, làm sao bạn truy xuất được toàn bộ tin nhắn AI hoặc trạng thái Active?**
👉 Chúng tôi sử dụng **Global Secondary Index (GSI)**. GSI tạo ra một cấu trúc dữ liệu bản sao ngầm định (asynchronous replica) đằng sau hậu trường, cho phép chúng tôi sử dụng một Partition Key khác (ví dụ: `messageType` là "ai"). Thay vì Scan toàn bộ bảng gốc, chúng tôi thực hiện lệnh Query trên GSI này, giúp tiết kiệm tối đa chi phí và giữ độ trễ siêu thấp.

**6. Tại sao nhóm lại cấu hình DynamoDB ở chế độ On-demand thay vì Provisioned?**
👉 Tính năng AI Chatbot của Kicks Shoes có đặc thù lưu lượng truy cập **Spiky Traffic** (tăng vọt đột ngột). Ví dụ: khi có đợt Flash Sale, lượng người dùng vào hỏi AI sẽ tăng gấp 100 lần so với ban đêm. Nếu dùng Provisioned, chúng tôi sẽ gặp lỗi `ProvisionedThroughputExceededException` khi traffic tăng quá nhanh, hoặc lãng phí tiền khi cấp phát thừa vào ban đêm. Chế độ On-demand giúp hệ thống tự động scale ngay lập tức theo từng Request mà không cần can thiệp thủ công.

**7. Hãy giải thích Data Access Pattern Log (Part A, B) của dự án?**
👉 Truy vấn quan trọng nhất (Primary Access Pattern) của chúng tôi là: "Hiển thị 50 tin nhắn mới nhất trong khung chat của người dùng". Tần suất là liên tục mỗi khi mở web. 
- **Mechanism**: Thay vì query toàn bộ, Backend gọi lệnh Query trên DynamoDB với `PK = CONV#<id>`, đảo ngược thứ tự `ScanIndexForward = false` (đọc từ Sort Key mới nhất trở xuống), và áp dụng `Limit = 50`. Việc này giúp DynamoDB chỉ đọc đúng 50 mục, tiêu thụ chính xác số RCU tối thiểu.

**8. Bạn đã chứng minh mã hóa dữ liệu (Encryption at Rest) trên DynamoDB như thế nào?**
👉 Theo yêu cầu bảo mật của W3, mọi dữ liệu lưu trữ tĩnh (at rest) phải được mã hóa. Chúng tôi đã bật tính năng này trong tab Additional Settings của bảng `kicks-shoes-dev-table`. Dữ liệu được mã hóa bằng thuật toán AES-256 thông qua **AWS Owned KMS Key**, đảm bảo an toàn tuyệt đối khỏi nguy cơ rò rỉ dữ liệu vật lý.

**9. Database của bạn có đảm bảo High Availability (HA - Độ sẵn sàng cao) không?**
👉 Có. Điểm mạnh của DynamoDB là nó tự động đồng bộ hóa dữ liệu (Synchronous Replication) ra 3 Availability Zones (AZ) khác nhau bên trong cùng một Region (us-west-2). Khác với RDS (nơi ta phải tự bật Multi-AZ và trả gấp đôi tiền), kiến trúc HA của DynamoDB được AWS quản lý hoàn toàn tự động và đã được tính sẵn trong chi phí.

**10. Điều gì xảy ra nếu DynamoDB của bạn gặp hiện tượng quá tải đọc (Read-heavy workload)?**
👉 Nếu lưu lượng đọc tăng đột biến và việc tăng RCU/On-demand trở nên đắt đỏ, chúng tôi sẽ nâng cấp kiến trúc bằng cách tích hợp **DynamoDB DAX (DynamoDB Accelerator)**. Đây là một In-memory cache hoạt động ở cụm Cluster. DAX sẽ caching lại các tin nhắn thường được đọc, giảm độ trễ từ milliseconds xuống microseconds (µs), đồng thời chặn các request trùng lặp không cho đánh thẳng vào bảng DynamoDB gốc.

**11. Nếu Kicks Shoes cần lưu trữ thông tin Đơn hàng và Thanh toán, DynamoDB có phù hợp không?**
👉 Có thể làm được thông qua `TransactWriteItems` (hỗ trợ ACID transactions trên nhiều item). Tuy nhiên, nếu nghiệp vụ chủ đạo của app là Thanh toán (Fintech/Banking), nơi yêu cầu tính toàn vẹn dữ liệu cực kỳ phức tạp và cần khóa (lock) dữ liệu, mô hình **Relational (RDS Postgres)** sẽ là lựa chọn phù hợp hơn. Dự án của chúng tôi ưu tiên DynamoDB vì dữ liệu cốt lõi hiện tại là Chat AI và Event Logging.

**12. Đâu là nhược điểm của kiến trúc Single-Table Design mà nhóm đang áp dụng?**
👉 Nhược điểm lớn nhất là **Tính thiếu linh hoạt (Inflexibility)**. Nếu sau này bộ phận Business yêu cầu truy vấn những mẫu dữ liệu mới (ví dụ: tìm kiếm các từ khóa bất kỳ trong tin nhắn), thì DynamoDB không thể dùng câu lệnh `LIKE '%word%'` như SQL được. Lúc đó, chúng tôi sẽ phải tích hợp thêm Amazon OpenSearch để index lại nội dung text, làm tăng độ phức tạp của hệ thống.

**13. So sánh Multi-AZ và Read Replica trong Amazon RDS. Khi nào dùng cái nào?**
👉 **Multi-AZ** phục vụ cho HA (High Availability). Dữ liệu được sao chép đồng bộ (Synchronous) sang một Standby Instance ở AZ khác. Khi node chính sập, AWS tự động chuyển DNS (Failover) sang node phụ trong vài phút. Node phụ KHÔNG THỂ dùng để đọc dữ liệu.
👉 **Read Replica** phục vụ cho Performance (Scale Reads). Dữ liệu được sao chép bất đồng bộ (Asynchronous) ra nhiều node. App có thể đọc dữ liệu từ các Replica này để giảm tải cho DB chính. Read Replica không hỗ trợ tự động Failover.

**14. DocumentDB phù hợp cho bài toán nào so với DynamoDB?**
👉 DocumentDB dùng mô hình Document Paradigm (tương thích MongoDB). Nó rất phù hợp khi dữ liệu là cấu trúc JSON lồng nhau sâu (Deeply nested JSON), có thuộc tính linh hoạt (Flexible schema) và yêu cầu việc truy vấn thống kê phức tạp (Aggregation pipelines) qua nhiều trường dữ liệu được đánh index. Nhược điểm là chi phí duy trì Cluster tối thiểu khá cao (~$200/tháng).

**15. Amazon Neptune giải quyết loại dữ liệu gì?**
👉 Neptune áp dụng mô hình **Graph Paradigm**. Nó sinh ra để giải quyết bài toán truy vấn mối quan hệ phức tạp, nhiều bước nhảy (Multi-hop traversals). Ví dụ: "Tìm những người bạn của bạn tôi, những người cũng đã mua đôi giày Kicks Shoes này". Nếu dùng RDS, ta phải dùng đệ quy hoặc self-join liên tục. Nếu dùng DynamoDB, ta phải thực hiện N+1 vòng lặp từ Client. Neptune giải quyết lệnh này trực tiếp trên DB trong vài mili-giây.

---

## Phần 2: Hạ tầng Mạng (VPC) & Security (Câu 16 - 30)

**16. Private Subnet và Public Subnet khác nhau về mặt kỹ thuật ở điểm nào?**
👉 Khác biệt duy nhất nằm ở **Route Table**. Một subnet là Public nếu Route Table của nó có một rule trỏ `0.0.0.0/0` tới **Internet Gateway (IGW)**. Ngược lại, nếu traffic `0.0.0.0/0` bị trỏ tới một **NAT Gateway** (nằm ở Public subnet khác), thì đó là Private Subnet.

**17. Tại sao S3 và DynamoDB lại được gọi là Serverless Public Services?**
👉 Vì bản chất chúng tồn tại bên ngoài VPC của người dùng. Địa chỉ IP của chúng là IP Public của AWS. Theo mặc định, để một máy chủ từ Private Subnet kết nối đến S3/DynamoDB, traffic phải đi qua NAT Gateway, vòng ra Internet Gateway rồi mới đến AWS.

**18. Tuần 2, dự án đã bị rò rỉ chi phí (cost leakage) do NAT Gateway. Nguyên nhân là gì?**
👉 NAT Gateway tính phí dựa trên số GB dữ liệu đi qua nó (`NAT Gateway Data Processing Charge`). Khi Backend ở Private Subnet liên tục gửi/nhận file ảnh, model AI từ S3, toàn bộ dữ liệu (Terabytes) bị đẩy qua NAT Gateway ra Internet, gây ra khoản phí phát sinh khổng lồ một cách âm thầm.

**19. Tuần 3, nhóm đã fix lỗi phí NAT Gateway đó bằng công nghệ gì?**
👉 Chúng tôi đã thiết lập **VPC Gateway Endpoint** cho S3 và DynamoDB. VPC Gateway Endpoint đóng vai trò như một "đường hầm tàng hình" chèn trực tiếp vào Route Table của Private Subnet (với đích đến là ID dạng `pl-xxxxx` trỏ tới `vpce-xxxx`). Mọi traffic từ Backend gọi S3/DynamoDB giờ đây sẽ đi thẳng qua mạng cáp quang nội bộ (Backbone) của AWS, loại bỏ hoàn toàn chi phí NAT Gateway và tăng tính bảo mật (không đi qua Internet).

**20. Sự khác biệt kiến trúc giữa Security Group (SG) và NACL (Network Access Control List)?**
👉 **Security Group** bảo vệ ở mức độ Instance/ENI (vòng trong). SG có tính **Stateful**: Khi bạn cho phép request đi vào (Inbound), response trả về tự động được cho phép mà không cần khai báo Outbound. SG mặc định chặn Inbound và chỉ có quy tắc `Allow`.
👉 **NACL** bảo vệ ở mức độ Subnet (vòng ngoài). NACL là **Stateless**: Mỗi gói tin đi vào hay đi ra đều bị kiểm tra độc lập. Phải cấu hình cả Inbound và Outbound. NACL hỗ trợ cả quy tắc `Allow` và `Deny`.

**21. Quy tắc Inbound của Database Security Group trong dự án được thiết lập thế nào?**
👉 Tuyệt đối không mở `0.0.0.0/0`. Inbound Rule của tầng Data (ví dụ RDS hoặc kết nối nội bộ) chỉ cho phép nhận lưu lượng mạng (Traffic) từ **ID của Application Security Group** (ví dụ `sg-backend-app`). Chúng tôi không dùng dải IP (`10.0.x.x`) vì IP của Backend trên ECS Auto Scaling thay đổi liên tục, việc dùng SG ID đảm bảo quy tắc luôn đúng dù ECS thay đổi container.

**22. Trong Negative Security Test (Mục 7 của W3), bạn đã cố tình văng lỗi bằng cách nào?**
👉 Chúng tôi đã cấu hình **VPC Endpoint Policy** của DynamoDB Endpoint (từ Full Access chuyển sang Custom Policy) và chủ động xóa bỏ quyền `dynamodb:Scan`. Lập tức, khi Frontend gọi API Health Check (có sử dụng lệnh Scan), hệ thống báo lỗi 503 Service Unavailable kèm thông báo: `because no VPC endpoint policy allows the dynamodb:Scan action`. Bức ảnh này chứng minh hệ thống đang áp dụng chính sách chặn tầng mạng cực kỳ chặt chẽ.

**23. IAM Role khác gì với IAM Policy?**
👉 **IAM Policy** là một file JSON định nghĩa cụ thể "Ai được làm gì trên Resource nào" (ví dụ: `s3:GetObject` trên bucket `kicks-shoes-frontend`). **IAM Role** là một thực thể ảo (Identity) có thể gán các Policy vào, và được "đội lên đầu" (Assume) bởi một dịch vụ AWS (ví dụ: ECS Task hoặc Lambda) để chúng có quyền thực thi.

**24. Least-Privilege (Quyền tối thiểu) đã được áp dụng trong Backend Role như thế nào?**
👉 Trong file `lambda-policy.json`, chúng tôi loại bỏ hoàn toàn dấu sao (`Resource: "*"`). Cụ thể: 
- Với DynamoDB, chỉ cho phép tác động lên đúng ARN của bảng `table/kicks-shoes-dev-table`.
- Với S3, chỉ cho phép đọc/ghi vào bucket `kicks-shoes-dev-uploads`.
- Nếu hacker chiếm được quyền của Backend, chúng không thể xóa các bucket khác hoặc đọc database của môi trường Production.

**25. Trình duyệt bắt lỗi "Mixed Content" và chặn request. Lỗi này là gì?**
👉 Đây là lỗi bảo mật mặc định của các trình duyệt hiện đại. Nếu một trang web được tải qua **HTTPS** (ví dụ CloudFront Frontend), nhưng nó thực hiện các cuộc gọi AJAX API ngầm tới một server **HTTP** không mã hóa (ví dụ Application Load Balancer), trình duyệt sẽ ngay lập tức "khóa mõm" request đó. Đây KHÔNG phải là lỗi CORS, CORS thậm chí còn chưa kịp chạy.

**26. Nhóm đã cấu hình kiến trúc thế nào để vượt qua lỗi Mixed Content?**
👉 Do ALB của môi trường Dev chưa được cấu hình SSL Certificate (vì không có Custom Domain), chúng tôi đã lách luật bằng cách triển khai một **CloudFront Distribution** mới để bọc lấy ALB. CloudFront tự động cung cấp chứng chỉ HTTPS (mặc định dạng `*.cloudfront.net`). Bằng cách này, luồng đi là: Frontend (HTTPS) -> Backend CloudFront (HTTPS) -> ALB (HTTP) -> ECS (HTTP). Mọi thao tác kết nối đều bảo mật và trình duyệt hoàn toàn vui vẻ.

**27. Khi đưa CloudFront ra trước ALB, làm sao cấu hình CORS hoạt động chính xác?**
👉 Mặc định CloudFront sẽ chặn/cắt bỏ các Headers nhạy cảm gửi từ trình duyệt. Nếu không cấu hình, ALB sẽ không nhận được header `Origin` và sẽ chặn request (lỗi CORS). Chúng tôi đã phải tạo **Origin Request Policy** (hoặc ForwardedValues) trên CloudFront để ép nó chuyển tiếp nguyên vẹn các headers: `Origin`, `Authorization` và `Referer` xuống thẳng cho Backend.

**28. AWS CloudTrail giúp ích gì trong việc xử lý sự cố?**
👉 CloudTrail là camera giám sát (Auditing Plane) của AWS. Nó lưu trữ toàn bộ các lời gọi API diễn ra trong tài khoản. Khi thực hiện Negative Security Test, thay vì chỉ chụp màn hình web, chúng tôi vào Event History của CloudTrail, search ErrorCode `AccessDenied` và tìm ra chính xác IAM Role nào đang bị chặn bởi Policy nào, tại đúng giây phút nào.

**29. Application Load Balancer (ALB) trong dự án nằm ở Subnet nào?**
👉 ALB được đặt ở **Public Subnets** (thuộc ít nhất 2 Availability Zones). ALB có IP Public và có thể giao tiếp với Internet (qua Internet Gateway). Tuy nhiên, các ECS Task của Backend lại nằm sâu trong **Private Subnets**. ALB làm nhiệm vụ nhận traffic từ ngoài, proxy và định tuyến nó vào các private container.

**30. Nếu dùng CloudFormation, hàm Intrinsic `!Ref` và `!GetAtt` khác nhau ra sao?**
👉 `!Ref` trả về định danh mặc định (Primary Identifier) của một resource (Ví dụ `!Ref MyBucket` sẽ trả về tên của bucket). `!GetAtt` dùng để lấy một thuộc tính cụ thể do AWS sinh ra (Ví dụ `!GetAtt MyBucket.Arn` sẽ trả về mã định danh ARN chuẩn của bucket đó).

---

## Phần 3: GenAI - Amazon Bedrock & Lambda (Câu 31 - 45)

**31. Giải thích cụm từ RAG (Retrieval-Augmented Generation) mà AI Kicks Shoes đang dùng?**
👉 RAG là kỹ thuật giúp AI trả lời chính xác dựa trên dữ liệu doanh nghiệp thay vì bịa chuyện (Hallucination). Thay vì Fine-tuning tốn kém, khi User hỏi "Kicks Shoes có giày chạy bộ nào?", hệ thống sẽ **Retrieve** (Tìm kiếm) đoạn văn bản chứa thông tin giày chạy bộ trong S3, sau đó nhúng đoạn text này vào Prompt và gửi cho LLM. LLM sẽ **Generate** (Tạo ra) câu trả lời chỉ dựa trên đoạn văn bản đó.

**32. Kiến trúc cụ thể của Bedrock Knowledge Base trong Kicks Shoes là gì?**
👉 Có 3 thành phần chính: 
1. **Data Source**: Bucket S3 chứa các file PDF/Markdown về sản phẩm Kicks Shoes. 
2. **Embeddings Model**: AWS Titan Text Embeddings, làm nhiệm vụ băm file text thành các vector số học (chunks). 
3. **Vector Store**: Amazon OpenSearch Serverless (hoặc Pinecone/Aurora) lưu trữ các vector này để tìm kiếm theo độ tương đồng không gian (Semantic Search).

**33. Khác biệt cốt lõi giữa API `Retrieve` và `RetrieveAndGenerate` trong Bedrock?**
👉 API `Retrieve` chỉ trả về mảng các đoạn Text (chunks) thô có nội dung liên quan nhất đến câu hỏi. Lập trình viên phải tự ghép nó vào Prompt và gọi model. API `RetrieveAndGenerate` làm thay toàn bộ việc đó: Nó tự động tìm chunks, tự động build Prompt, tự gọi Foundation Model (Nova Lite) và trả về cho bạn một câu trả lời hoàn chỉnh bằng tiếng người, kèm theo các đường link Trích dẫn (Citations).

**34. Amazon Bedrock Agent có cấu trúc 4 phần nào? Kicks Shoes đang dừng ở phần nào?**
👉 4 thành phần của một Agent: 
1. **Foundation Model** (Bộ não suy luận).
2. **Instructions** (Chỉ thị cá nhân hóa).
3. **Knowledge Base** (Kho tri thức tĩnh để tra cứu).
4. **Action Groups** (Các hành động tích hợp Lambda để làm thay đổi trạng thái, ví dụ: "Hủy đơn hàng").
Hiện tại Kicks Shoes đang khai thác rất mạnh thành phần thứ 3 (Knowledge Base + RAG). Action Groups sẽ là hướng mở rộng trong tương lai.

**35. Tầm quan trọng của IAM permission `bedrock:GetInferenceProfile` là gì?**
👉 Khi sử dụng các Foundation Model đời mới (như họ Nova Lite, Nova Pro), AWS Bedrock yêu cầu Role gọi API phải có quyền `bedrock:GetInferenceProfile` để truy cập vào cấu hình Application Inference Profile của model đó. Đây là lỗi Access Denied phổ biến nhất mà chúng tôi đã gặp phải và khắc phục trong quá trình deploy Lambda.

**36. Kiến trúc Backend của Kicks Shoes gọi Bedrock thông qua cơ chế nào?**
👉 Backend (Node.js) sử dụng AWS SDK v3 (`@aws-sdk/client-bedrock-agent-runtime`). Nó khởi tạo một command là `RetrieveAndGenerateCommand`, truyền vào ID của Knowledge Base, ARN của Model (`amazon.nova-lite-v1:0`), và input text của User. Hàm này được chạy dưới identity của IAM Role được gắn vào ECS Task/Lambda.

**37. Cold Start trong AWS Lambda là gì?**
👉 Lambda là Serverless (Không máy chủ). Khi không có request trong một thời gian, AWS sẽ thu hồi môi trường chạy. Khi có request mới đến, AWS phải tốn thời gian (từ vài trăm mili-giây đến vài giây) để tải code từ S3, khởi tạo môi trường (Node.js/Python), và chạy hàm khởi tạo (Init phase). Sự chậm trễ ở request đầu tiên này gọi là Cold Start.

**38. Bạn đã làm gì để giảm thiểu Cold Start trong Lambda của Kicks Shoes?**
👉 Có 2 phương pháp: 
1. Viết code tối ưu: Đưa các lệnh khởi tạo kết nối (DB Connection, Bedrock Client init) ra ngoài phạm vi hàm Handler. Khi Cold Start xảy ra, các object này được tạo 1 lần và tái sử dụng cho các Warm Starts tiếp theo. 
2. Provisioned Concurrency: Trả tiền để AWS giữ sẵn một số lượng môi trường luôn "nóng".

**39. Gọi Lambda từ S3 Event là Synchronous hay Asynchronous?**
👉 Là **Asynchronous** (Bất đồng bộ). Khi có file upload lên S3, S3 ném một Event vào Event Queue của Lambda và quay đi ngay lập tức. Lambda sẽ âm thầm chạy ngầm phía sau. Nếu Lambda bị lỗi (Crash), nó sẽ được hệ thống AWS tự động Retry (Thử lại) miễn phí theo cấu hình (mặc định là 2 lần).

**40. Gọi Lambda từ API Gateway là Synchronous hay Asynchronous?**
👉 Là **Synchronous** (Đồng bộ). API Gateway giữ nguyên kết nối HTTP (Hold connection) và chờ Lambda thực thi xong để lấy dữ liệu JSON trả về cho Client. Nếu quá 29 giây mà Lambda chưa chạy xong, API Gateway sẽ cắt đứt và trả về lỗi 504 Gateway Timeout.

**41. AI Hallucination (Ảo giác AI) là gì? RAG giúp gì được?**
👉 Ảo giác là khi LLM tự "bịa" ra thông tin sai sự thật nhưng với giọng văn cực kỳ tự tin (ví dụ: bịa ra chính sách hoàn tiền 100 năm của Kicks Shoes). RAG kìm hãm ảo giác bằng cách ép LLM chỉ được trả lời dựa trên khung ngữ cảnh (Context) được cung cấp từ tài liệu công ty lấy từ Knowledge Base.

**42. Bạn làm thế nào để debug một hàm Lambda bị sập ngầm?**
👉 Truy cập **Amazon CloudWatch Logs**. Mỗi hàm Lambda tự động tạo một Log Group (Ví dụ: `/aws/lambda/kicks-shoes-dev-main-bedrock-chat`). Mọi hàm `console.log()` hoặc thông báo lỗi (Exceptions) đều được ghi vào các Log Streams ở đây kèm theo Timestamp chính xác tới mili-giây.

**43. Prompt Engineering trong Bedrock ảnh hưởng thế nào đến kết quả?**
👉 Việc định nghĩa System Prompt (ví dụ: "You are an expert sneaker assistant at Kicks Shoes. Be concise and energetic.") giúp định hình Tone & Voice của chatbot. Trong Bedrock, Prompt này được cấu hình trong phần Instructions của Agent hoặc ép vào phần override của lệnh `RetrieveAndGenerate`.

**44. Tại sao model Nova Lite lại được ưu tiên thay vì Claude 3.5 Sonnet?**
👉 Kiến trúc RAG thường yêu cầu 2 yếu tố: 1. Model phải đủ thông minh để đọc hiểu context tiếng Việt/Anh; 2. Tốc độ trả lời (Time-to-first-token) phải cực kỳ nhanh. Nova Lite là dòng model tối ưu hóa (Cost-effective) của Amazon, giá siêu rẻ nhưng tốc độ inference nhanh gấp nhiều lần các model hạng nặng (Heavyweight) như Claude 3.5 Sonnet, mang lại trải nghiệm Chat mượt mà cho người dùng cuối.

**45. Nếu thay đổi nội dung file PDF trên S3, Chatbot có biết ngay lập tức không?**
👉 Không. Bedrock Knowledge Base không đọc trực tiếp file PDF mỗi khi chat. Dữ liệu trên S3 cần phải được chạy tiến trình **Data Source Sync** để băm lại nội dung và cập nhật vào Vector Store. Nếu không nhấn nút Sync (hoặc không gọi API StartIngestionJob), Chatbot sẽ vẫn trả lời theo dữ liệu cũ.

---

## Phần 4: Bảo vệ Live Demo & Thuyết Trình (Câu 46 - 50)

**46. Trong buổi thứ Sáu (Friday QnA), bạn được yêu cầu chứng minh W3 đã sửa lỗi W2 (Missing Encryption và Broad IAM). Bạn làm thế nào?**
👉 
- **Encryption**: Mở bảng DynamoDB, vào mục Additional Settings, chỉ vào trạng thái `Default: AWS Owned key` đã được bật (Enabled). 
- **IAM Policy**: Mở file `lambda-policy.json` trên màn hình chiếu, kéo xuống phần `Action: dynamodb:*` và chỉ tay vào đoạn `Resource: arn:aws:dynamodb:us-west-2:438465144712:table/kicks-shoes-dev-table`. Nhấn mạnh rằng chúng tôi đã vứt bỏ dấu `*` nguy hiểm và cấp quyền theo nguyên tắc Least-Privilege.

**47. (Live Demo) Trình bày một thao tác tương tác thực tế với Database để chứng minh Paradigm Key-Value.**
👉 "Thưa các Trainer, để chứng minh Paradigm Key-Value hoạt động tối ưu, em sẽ truy xuất toàn bộ lịch sử trò chuyện của một User". 
(Thực hành): Mở DynamoDB Console -> Explore Items -> Đổi từ Scan sang **Query** -> Ở ô Partition Key nhập `CONV#687ba0f0082154e8f3d58957` -> Bấm Run. 
"Kết quả trả về 5 items trong vòng chưa tới 10ms. DynamoDB đã nhảy trực tiếp đến phân vùng băm của hội thoại này mà không cần đọc bất kỳ đoạn chat của user nào khác. Đây là sức mạnh của Key-Value so với SQL".

**48. (Negative Test) Hãy chứng minh hạ tầng mạng của bạn được bảo mật vòng trong.**
👉 "Hiện tại ứng dụng đang chạy bình thường. Em sẽ truy cập vào VPC Endpoint Policy của DynamoDB, đổi đoạn JSON từ Allow thành Deny cho hành động `dynamodb:Scan`". 
(Thực hành): Chỉnh Policy, đợi 1 phút. Mở lại web F5. 
"Như các bạn thấy, Frontend hiện chữ đỏ `Disconnected`, Network báo lỗi 503 Service Unavailable, và Log ghi rõ `because no VPC endpoint policy allows...`. Điều này chứng minh ứng dụng không thể vượt mặt lớp bảo vệ hạ tầng VPC dù Application Code không hề có lỗi".

**49. Trình chiếu Evidence Pack phần "Data Access Pattern Log (Part C)" - Nhấn mạnh The Wrong-Paradigm Test.**
👉 (Bật slide Part C): "Nếu chúng tôi sử dụng mô hình DocumentDB (MongoDB) thay vì DynamoDB cho tính năng Chat: Việc chat đòi hỏi lưu trữ các object phẳng, độc lập (Flat items) với tốc độ cao. Dùng Document Paradigm, chúng tôi sẽ bị cám dỗ nhồi nhét (embed) mảng `messages: [...]` vào bên trong document của `Conversation`. Khi số lượng tin nhắn đạt 10,000, document đó sẽ phình to vượt giới hạn 16MB của BSON, buộc chúng tôi phải viết code phân mảnh (pagination) cực kỳ đau khổ. DynamoDB Flat Design là chân ái!".

**50. Điểm sáng lớn nhất trong kiến trúc Kicks Shoes tuần này là gì?**
👉 Sự kết hợp nhuần nhuyễn giữa **Serverless AI (Bedrock)**, **Serverless Database (DynamoDB On-demand)** và **Serverless Network (VPC Gateway Endpoint)**. Hạ tầng này không tiêu tốn 1 đồng nào nếu không có ai sử dụng, nhưng sẵn sàng đáp ứng hàng triệu requests tự động khi có chiến dịch quảng cáo. Các lớp Security Group và CloudFront được cấu hình để che chắn lỗi Mixed Content mà vẫn tuân thủ Least-Privilege, thể hiện tư duy của một Cloud Architect thực thụ.

---
**Với bộ tài liệu 50 câu hỏi chuyên sâu này, Kicks Shoes hoàn toàn đủ tư liệu để bảo vệ xuất sắc kiến trúc trước mọi câu hỏi khó nhất từ Trainer!**
