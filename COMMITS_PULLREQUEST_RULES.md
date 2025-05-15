# 📘 Quy tắc Commit theo chuẩn Conventional Commits

## ✅ Mục tiêu

Áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/) để:

- Quản lý lịch sử commit rõ ràng, có cấu trúc.
- Dễ dàng truy vết task liên quan (đặc biệt khi cần fix lỗi).
- Giúp quản lý và review code hiệu quả hơn.

---

## 🎯 Cấu trúc commit message

[ID Jira][function][type] <mô tả ngắn gọn thay đổi>

### 🔍 Ví dụ:

[SDNPRJ-1][UI][feat] Add register user
[SDNPRJ-2][BE][fix] Fix don't send email

📌 _Lưu ý:_ Mục đích là để dễ tra lại task để fix lỗi sau này và quản lý người handle task đó.

---

## 🗂 Các loại function

| Function | Mô tả                       |
| -------- | --------------------------- |
| `UI`     | Handle giao diện người dùng |
| `BE`     | Handle logic và backend     |

---

## 🗂 Các loại commit

| Type       | Mô tả                                                        |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Thêm tính năng mới                                           |
| `fix`      | Sửa lỗi                                                      |
| `docs`     | Cập nhật tài liệu (README, Wiki, ...)                        |
| `style`    | Thay đổi định dạng code (không ảnh hưởng đến logic)          |
| `refactor` | Cải tổ lại code cho sạch, dễ hiểu (không thêm chức năng mới) |
| `test`     | Thêm hoặc chỉnh sửa test                                     |
| `chore`    | Thay đổi phụ trợ như cấu hình, build, cập nhật dependencies  |
| `perf`     | Cải thiện hiệu năng                                          |

---

## 🧩 Quy định bổ sung

- ❌ **Toàn bộ commit và pull request phải được viết bằng tiếng Anh.**
- ✅ **Phải review lại code cẩn thận trước khi commit.**

---

## 🌿 Quy tắc đặt tên branch

### ✔ Cấu trúc:

`<type>/<screen>-<ui|be>`

### 📌 Ví dụ:

- `feature/login-ui`
- `feature/product-detail-be`
- `bugfix/email-sending-ui`
- `refactor/api-handler-be`

### 📎 Ghi chú:

- Trong giai đoạn đầu, branch thường sẽ là `feature/*` cho tất cả các chức năng mới.
- Sau này sẽ bổ sung thêm các nhánh `bugfix`, `refactor` khi phát sinh nhu cầu.
- Mỗi branch nên rõ ràng phần nào thuộc **UI** hay **BE** thông qua hậu tố `-ui` hoặc `-be`.

---

## 🔀 Quy tắc tạo Pull Request (PR)

### ✅ Tiêu đề PR

[function][type] <mô tả ngắn gọn thay đổi>

#### 📌 Ví dụ:

- `[UI][feat] Add user profile screen`
- `[BE][fix] Fix email notification bug`

---

### 📄 Nội dung PR bắt buộc phải có:

1. **Mô tả tổng quan (Overview)**

   - Giải thích ngắn gọn thay đổi gì, tại sao cần thay đổi này.

2. **Liên kết task (Jira/Trello/GitHub Project)**
   - Gắn link task tương ứng để dễ truy xuất.

---

<!-- KHÔNG CẦN ĐOẠN NÀY, ĐỌC THÊM -->
<!-- 3. **Cách kiểm tra (How to test)**

   - Mô tả bước để test tính năng hoặc bug fix.
   - Ưu tiên thêm ảnh/gif nếu có giao diện.

4. **Ảnh chụp màn hình (nếu thay đổi UI)**

   - Đính kèm ảnh trước/sau nếu có thay đổi giao diện.

5. **Checklists**
   - [ ] Đã test đầy đủ trước khi tạo PR
   - [ ] Đã tự review lại code
   - [ ] Đảm bảo không commit các file không cần thiết (VD: `.env`, `node_modules`, build folder, v.v.)
   - [ ] Đã đặt tên branch, commit theo đúng quy định
      - [ ] Đã test đầy đủ trước khi tạo PR
   - [ ] Đã tự review lại code
   - [ ] Đảm bảo không commit các file không cần thiết (VD: `.env`, `node_modules`, build folder, v.v.)
   - [ ] Đã đặt tên branch, commit theo đúng quy định
   - [ ] Đã pull source mới nhất về nhánh và xử lý conflict
   - [ ] Đã thêm đủ label mô tả, function
   - [ ] Đã thêm reviewers

   - [ ] Fully tested before creating the PR
   - [ ] Self-reviewed the code
   - [ ] Ensured no unnecessary files are committed (e.g., .env, node_modules, build folder, etc.)
   - [ ] Branch name and commit messages follow the naming conventions
   - [ ] Pulled the latest source to the branch and resolved any conflicts
   - [ ] Added appropriate labels and function descriptions
   - [ ] Added reviewers
   -->

---

### 🔍 Review và Merge

- Tối thiểu **1-2 reviewer** được assign để kiểm tra PR.
- ❌ **Không tự ý merge** nếu chưa có approval từ reviewer (trừ trường hợp khẩn cấp và phải thông báo trước).

---

### 🧹 Sau khi merge

- Cập nhật trạng thái task trên hệ thống quản lý công việc (Jira/Trello/...).
