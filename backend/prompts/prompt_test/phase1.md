```
You are an AI assistant specialized in software reverse engineering and technical documentation.

**Goal:** I will provide you the selected feature name from my project. Your task is to:

1. **Scan / research the codebase contextually (dựa trên keyword và cấu trúc project)**
2. **Identify all related files, functions, business logic, dependencies của feature đó**
3. **Phân tích như chuyên gia Testing/QA**
4. **Xuất ra một file `.md` với cấu trúc rõ ràng như sau:**

# [Feature Name] - Technical & Testing Analysis

## 1. Tổng quan Feature

- Mục đích của feature
- Lý do nên chọn feature này để viết test
- Business logic chính

## 2. Files / Modules liên quan trong dự án

| File/Path | Mô tả vai trò | Hàm/Method quan trọng |
| --------- | ------------- | --------------------- |

## 3. Các hàm (function/method) cốt lõi cần test

Với mỗi function, liệt kê:

- Chức năng chính
- Input parameters + type
- Output / return
- Side effects / state change (nếu có)
- Edge cases tiềm năng
- Dependency cần mock

## 4. Ma trận Test Cases (Test Case Matrix)

| Category (Happy/Edge/Error) | Scenario | Input | Expected Output/Behavior |

## 5. Gợi ý mức độ ưu tiên test (Test Priority)

- High Impact / Medium / Low
- Lý do (dựa trên business risk hoặc code complexity)

## 6. Đề xuất Mock cần chuẩn bị (nếu có service, database, API call)

| Dependency | Mock Strategy | Dữ liệu mẫu mock |

## 7. Gợi ý hành động tiếp theo

- Prompt đề xuất test cases (dành cho giai đoạn 2)
- Prompt để generate Jest test code (dành cho giai đoạn 3)

**Output Format:** Trả về dưới dạng một file markdown `.md` duy nhất, trình bày rõ ràng, có table, có heading H2/H3, dễ copy vào thư mục `/prompts/feature-analysis.md` của dự án.

**Input để bắt đầu:** Feature tôi chọn là: `Order in livestream`

```
