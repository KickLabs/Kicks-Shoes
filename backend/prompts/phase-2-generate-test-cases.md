# Prompt: Generate Test Cases Matrix - Order in Livestream Feature

## Context

Tôi đã có file phân tích kỹ thuật chi tiết về feature "Order in Livestream" tại file `feature-analysis-order-in-livestream.md`. Feature này cho phép tự động phát hiện đơn hàng từ chat messages trong livestream, tạo potential orders, và tự động convert sang real orders.

## Your Task

Dựa trên feature analysis document, hãy generate một **Test Cases Matrix** chi tiết và chuyên nghiệp theo format chuẩn Testing/QA.

---

## Output Format Requirements

### 1. Structure tổng thể

```markdown
# Test Cases Matrix - Order in Livestream Feature

## Test Summary

- Total Test Cases: [số]
- High Priority: [số]
- Medium Priority: [số]
- Low Priority: [số]

## Test Suites Breakdown

1. [Suite Name] - [số] test cases
2. [Suite Name] - [số] test cases
   ...

---

## Test Suite 1: [Name]

| Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies |
| ------- | -------- | ------------- | -------------- | ---------- | --------- | --------------- | -------- | ------------ |
| TC-001  | ...      | ...           | ...            | ...        | ...       | ...             | High     | ...          |
```

---

## 2. Test Suite Phân Loại

Chia test cases thành các suites sau:

### Suite 1: Message Analysis & Order Detection

- Focus: `orderDetectionService.analyzeMessage()`
- Scope: Phone extraction, keyword detection, confidence scoring

### Suite 2: Product Information Extraction

- Focus: `orderDetectionService.extractProductInfo()`
- Scope: SKU matching, size/color parsing, quantity extraction

### Suite 3: Chat Message Handling

- Focus: `liveStreamService.handleChatMessage()`
- Scope: WebSocket integration, potential order creation, real-time notifications

### Suite 4: Potential Order Management

- Focus: `potentialOrderController` CRUD operations
- Scope: Status updates, filtering, statistics

### Suite 5: Order Auto-Creation

- Focus: `updateOrderStatus()` với status = "confirmed"
- Scope: Inventory check, order creation, email notification

### Suite 6: Edge Cases & Error Handling

- Focus: Boundary values, null/undefined, exceptions
- Scope: Database errors, concurrent operations, invalid inputs

### Suite 7: Integration & E2E

- Focus: Full flow từ chat message → confirmed order
- Scope: Multiple services working together

---

## 3. Test Case Column Definitions

### Test ID Format

- `TC-[Suite Number][Sequential Number]`
- Ví dụ: `TC-101`, `TC-102`, ... (Suite 1), `TC-201`, `TC-202`, ... (Suite 2)

### Category

- `Happy Path` - Luồng chính thành công
- `Alternative Path` - Luồng phụ hợp lệ
- `Edge Case` - Giá trị biên, trường hợp đặc biệt
- `Negative Test` - Input không hợp lệ
- `Error Handling` - Xử lý lỗi hệ thống
- `Performance` - Kiểm tra hiệu năng
- `Security` - Kiểm tra bảo mật

### Test Scenario

- Mô tả ngắn gọn (1-2 câu) về điều cần test
- Bắt đầu bằng động từ: "Verify that...", "Test...", "Validate..."

### Pre-conditions

- Danh sách điều kiện cần có trước khi test
- Ví dụ:
  - "Livestream is active with roomId = 'test-room-123'"
  - "User is authenticated as viewer"
  - "Product 'HJ6777' exists in database"

### Test Steps

- Numbered list các bước thực hiện
- Rõ ràng, có thể repeat
- Format: `1. [Action] 2. [Action] 3. [Verify]`

### Test Data

- Input data cụ thể cho test case
- Format: Key-value hoặc JSON snippet
- Ví dụ: `message: "Chốt đơn 0912345678 size 42"`

### Expected Result

- Kết quả mong đợi rõ ràng, measurable
- Bao gồm:
  - Return values
  - Database changes
  - API responses
  - Side effects

### Priority

- `High` - Must test, blocking issues
- `Medium` - Should test, important but not blocking
- `Low` - Nice to test, minor issues

### Dependencies

- Mock/stub nào cần thiết
- External services
- Database setup

---

## 4. Specific Requirements

### A. Coverage từ Feature Analysis

Đảm bảo cover TẤT CẢ các scenarios đã liệt kê trong section "4. Ma trận Test Cases":

- ✅ Happy path với phone + keywords
- ✅ SKU matching (base SKU, inventory SKU)
- ✅ Composite pattern parsing
- ✅ Edge cases: missing phone, missing keywords, invalid format
- ✅ Multiple phone numbers
- ✅ Out of stock handling
- ✅ Price = 0 or null
- ✅ Concurrent operations
- ✅ Email failure handling
- ✅ Priority calculation
- ✅ Flash sale price application
- ✅ Featured product matching
- ✅ Security (injection, XSS)

### B. Test Data Examples

Mỗi test case PHẢI có test data cụ thể. Sử dụng realistic Vietnamese data:

**Valid Phone Numbers:**

- `0912345678`, `0987654321`, `0355123456`

**Valid Messages:**

- `"Chốt đơn HJ6777 màu đen size 42 sđt 0912345678"`
- `"Mua 2 đôi size 40 ship cho em 0987654321"`
- `"Order cái này màu trắng 0355123456"`

**Valid SKUs:**

- `HJ6777`, `NK-HBP-101`, `AD8901`

**Valid Sizes:**

- Shoes: `36`, `37`, `38`, `39`, `40`, `41`, `42`, `43`, `44`
- Clothing: `XS`, `S`, `M`, `L`, `XL`, `XXL`
- Accessory: `ONESIZE`

**Valid Colors (Vietnamese):**

- `đen`, `trắng`, `đỏ`, `xanh`, `vàng`, `hồng`, `nâu`, `xám`

### C. Expected Results Format

**For analyzeMessage():**

```json
{
  "isOrder": true/false,
  "confidence": 0.75,
  "data": {
    "customerInfo": { "phoneNumber": "0912345678", ... },
    "productInfo": { "extractedSize": "42", ... }
  }
}
```

**For API responses:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**For database changes:**

- `PotentialOrder created with _id = <ObjectId>`
- `Order.status changed from 'pending' to 'confirmed'`

---

## 5. Quality Criteria

### Each test case must have:

1. ✅ Unique Test ID
2. ✅ Clear, actionable scenario description
3. ✅ Specific pre-conditions (không generic)
4. ✅ Numbered test steps (ít nhất 2 steps)
5. ✅ Concrete test data (không placeholder)
6. ✅ Measurable expected results
7. ✅ Correct priority assignment
8. ✅ List of dependencies/mocks needed

### Avoid:

- ❌ Vague descriptions: "Test basic functionality"
- ❌ Generic data: "Use valid input"
- ❌ Ambiguous results: "Should work correctly"
- ❌ Missing steps: "Execute test"

---

## 6. Minimum Test Case Count

Tạo tối thiểu:

- **Suite 1 (Message Analysis):** 15 test cases
- **Suite 2 (Product Extraction):** 20 test cases
- **Suite 3 (Chat Handling):** 12 test cases
- **Suite 4 (PO Management):** 10 test cases
- **Suite 5 (Order Creation):** 15 test cases
- **Suite 6 (Edge Cases):** 15 test cases
- **Suite 7 (Integration):** 8 test cases

**Total:** Minimum 95 test cases

---

## 7. Example Test Cases (Reference)

### Example 1: Happy Path

| Test ID | Category   | Test Scenario                                                        | Pre-conditions                                                         | Test Steps                                                                                   | Test Data                                                                                           | Expected Result                                                                                                                                                 | Priority | Dependencies                             |
| ------- | ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------- |
| TC-101  | Happy Path | Verify message with phone and order keywords creates potential order | - Livestream active<br>- User authenticated<br>- Product HJ6777 exists | 1. Viewer sends chat message<br>2. Call analyzeMessage()<br>3. Verify PotentialOrder created | `message: "Chốt đơn HJ6777 size 42 sđt 0912345678"`<br>`user: { _id: user123, username: "buyer1" }` | - isOrder = true<br>- confidence >= 0.4<br>- PotentialOrder document created<br>- customerInfo.phoneNumber = "0912345678"<br>- productInfo.extractedSize = "42" | High     | Mock: Product.findOne(), User.findById() |

### Example 2: Edge Case

| Test ID | Category  | Test Scenario                                          | Pre-conditions      | Test Steps                                                                                               | Test Data                        | Expected Result                                                     | Priority | Dependencies |
| ------- | --------- | ------------------------------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------- | -------- | ------------ |
| TC-601  | Edge Case | Verify message with keywords but no phone returns null | - Livestream active | 1. Viewer sends message without phone<br>2. Call analyzeMessage()<br>3. Verify no PotentialOrder created | `message: "Mua size 42 màu đen"` | - Return null<br>- No PotentialOrder created<br>- No database write | Medium   | None         |

### Example 3: Error Handling

| Test ID | Category       | Test Scenario                                                  | Pre-conditions                                  | Test Steps                                                                                                          | Test Data                                                                  | Expected Result                                                                                       | Priority | Dependencies                 |
| ------- | -------------- | -------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| TC-602  | Error Handling | Verify database error during PO creation is handled gracefully | - Livestream active<br>- DB connection unstable | 1. Send valid order message<br>2. Mock DB to throw error<br>3. Call handleChatMessage()<br>4. Verify error handling | `message: "Chốt 0912345678"`<br>`Mock: PotentialOrder.save() throws error` | - Error logged<br>- Chat message still saved<br>- Function doesn't crash<br>- Error response returned | High     | Mock: Database error, Logger |

---

## 8. Special Focus Areas

### A. Phone Number Variations

Tạo test cases cho các format:

- Standard: `0912345678`
- With spaces: `0912 345 678`
- With dots: `0912.345.678`
- With dashes: `0912-345-678`
- Invalid length: `091234567` (9 digits)
- Invalid prefix: `0212345678` (starts with 02)

### B. Size Patterns

Test cases cho mọi pattern trong `sizePatterns`:

- `size 42`, `Size 42`, `SIZE 42`
- `cỡ 42`, `số 42`
- `42 size`, `42 cỡ`
- `size XL`, `cỡ XL`
- `one size`, `onesize`, `ONESIZE`

### C. SKU Matching Priority

Test hierarchy:

1. Base product SKU match
2. Inventory variant SKU match
3. Featured product fallback
4. No product match (productId = null)

### D. Concurrent Operations

Test cases cho:

- 10 messages gửi đồng thời
- 2 hosts confirm cùng 1 PO
- Order creation khi inventory đang được update

---

## 9. Deliverable Checklist

Hoàn thành khi có:

- [ ] Test summary table với số lượng
- [ ] 7 test suites với tables đầy đủ
- [ ] Minimum 95 test cases
- [ ] Mỗi test case có đủ 8 columns
- [ ] Ít nhất 30% High priority
- [ ] Cover tất cả functions từ section 3 của feature analysis
- [ ] Cover tất cả edge cases từ section 4 của feature analysis
- [ ] Realistic Vietnamese test data
- [ ] Cross-reference Test IDs trong dependencies

---

## 10. Output Format

**Language:** Tiếng Việt for descriptions, English for technical terms

**File Format:** Markdown với tables

**Naming:** `test-cases-matrix-order-in-livestream.md`

---

## Ready to Generate?

Sử dụng prompt này với instruction:

> "Hãy generate Test Cases Matrix đầy đủ theo format và requirements trên. Bắt đầu từ Test Suite 1 và làm lần lượt cho đến Suite 7. Mỗi test case phải có đủ 8 columns và dữ liệu cụ thể. Đảm bảo realistic và có thể execute được."

---

**Prompt Version:** 1.0  
**Compatible with:** Feature Analysis v1.0  
**Expected Output:** 95+ test cases in matrix format  
**Estimated Generation Time:** 15-20 minutes with AI assistance
