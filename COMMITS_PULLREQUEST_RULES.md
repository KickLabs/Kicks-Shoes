# 📘 Quy tắc Commit theo chuẩn Conventional Commits / Commit Rules (Bilingual)

---

## ✅ Mục tiêu | Purpose

Áp dụng chuẩn [Conventional Commits](https://www.conventionalcommits.org/) để:

- Quản lý lịch sử commit rõ ràng, có cấu trúc.
- Dễ dàng truy vết task liên quan (đặc biệt khi cần fix lỗi).
- Giúp quản lý và review code hiệu quả hơn.

Apply [Conventional Commits](https://www.conventionalcommits.org/) to:

- Maintain a clear, structured commit history.
- Easily trace related tasks (especially for debugging).
- Improve code management and review process.

---

## 🎯 Cấu trúc commit message | Commit Message Structure

```
[Jira ID][function][type] <mô tả thay đổi | short description>
```

### Ví dụ | Examples:

- `[SDNPRJ-1][UI][feat] Add register user`
- `[SDNPRJ-2][BE][fix] Fix don't send email`

📌 _Lưu ý | Note_: Giúp dễ dàng truy vết task và người thực hiện.

---

## 🗂 Các loại function | Function Types

| Function | Mô tả (VN)            | Description (EN)         |
| -------- | --------------------- | ------------------------ |
| `UI`     | Giao diện người dùng  | Frontend / Interface     |
| `BE`     | Logic / xử lý backend | Backend / Business logic |

---

## 🗂 Các loại commit | Commit Types

| Type       | Mô tả (VN)                                      | Description (EN)                     |
| ---------- | ----------------------------------------------- | ------------------------------------ |
| `feat`     | Thêm tính năng mới                              | Add new feature                      |
| `fix`      | Sửa lỗi                                         | Bug fix                              |
| `docs`     | Cập nhật tài liệu                               | Documentation update                 |
| `style`    | Thay đổi định dạng code (không ảnh hưởng logic) | Code style changes (no logic change) |
| `refactor` | Cải tổ lại code (không thêm chức năng mới)      | Refactor code (no behavior change)   |
| `test`     | Thêm/chỉnh sửa test                             | Add or update tests                  |
| `chore`    | Cập nhật cấu hình, build, dependencies,...      | Config/build/dependency updates      |
| `perf`     | Cải thiện hiệu năng                             | Performance improvements             |

---

## 🧩 Quy định bổ sung | Additional Rules

- ❌ **Commit và PR phải bằng tiếng Anh.**  
  All commit messages and PRs must be in English.

- ✅ **Phải tự review kỹ code trước khi commit.**  
  Code must be self-reviewed carefully before committing.

---

## 🌿 Quy tắc đặt tên branch | Branch Naming Convention

```
<type>/<screen>-<ui|be>
```

### Ví dụ | Examples:

- `feature/login-ui`
- `feature/product-detail-be`
- `bugfix/email-sending-ui`
- `refactor/api-handler-be`

📎 Ghi chú | Notes:

- Giai đoạn đầu: dùng `feature/*`  
  Early development: use `feature/*`
- Sau sẽ mở rộng `bugfix`, `refactor`, v.v.  
  Later: add `bugfix`, `refactor`, etc.
- Hậu tố `-ui` hoặc `-be` để rõ chức năng.  
  Suffix `-ui` or `-be` for clarity.

---

## 🔀 Quy tắc Pull Request | Pull Request Guidelines

### ✅ Tiêu đề PR | PR Title Format

```
[function][type] <mô tả ngắn | short description>
```

**Ví dụ | Examples:**

- `[UI][feat] Add user profile screen`
- `[BE][fix] Fix email notification bug`

---

### 📄 Nội dung PR | PR Description Must Include

1. **Mô tả tổng quan | Overview**
2. **Link task liên quan | Related task link (Jira/Trello/GitHub)**
3. **Cách kiểm tra | How to test**
   - Bước test, ảnh hoặc GIF nếu có UI.
4. **Ảnh chụp màn hình (nếu có UI thay đổi) | Screenshot (if UI changes)**
5. **Checklist**

VN
```markdown
- [ ] Đã test đầy đủ
- [ ] Tự review code
- [ ] Không commit file không cần thiết (.env, node_modules, ...)
- [ ] Đúng quy tắc tên branch, commit
- [ ] Đã xử lý conflict
- [ ] Có label và reviewers phù hợp
```

EN
```markdown
- [ ] Fully tested before creating the PR
- [ ] Self-reviewed the code
- [ ] Ensured no unnecessary files are committed (.env, node_modules, ...)
- [ ] Branch and commit follow conventions
- [ ] Resolved all conflicts
- [ ] Added proper labels and reviewers
```

---

## 🔍 Review & Merge

- Cần tối thiểu **1–2 reviewer** approve PR.  
  Minimum **1–2 reviewers** must approve.

- ❌ Không merge nếu chưa có approval (trừ trường hợp khẩn cấp).  
  Do **not merge without approval**, unless emergency and communicated.

---

## 🧹 Sau khi merge | After Merge

- Cập nhật trạng thái task trên Jira/Trello/...  
  Update task status on your project management system.

---
