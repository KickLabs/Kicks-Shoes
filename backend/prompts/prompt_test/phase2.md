Prompt 2: Generate Test Cases
"Generate a comprehensive **Test Cases Matrix** (Markdown) for the feature **Order in Livestream**, based on `feature-analysis-order-in-livestream.md`.

**Feature Summary**
The system detects orders from livestream chat messages, creates **Potential Orders**, and automatically converts them into **Orders**.

**Output**
Return exactly ONE Markdown file named header:
`# test-cases-matrix-order-in-livestream.md`

Each test case must be a row with **8 columns** in this order:
`Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies`

**Suites & Targets (generate in order, keep minimum counts)**

1. Message Analysis & Order Detection (≥15) — `orderDetectionService.analyzeMessage()`
2. Product Information Extraction (≥20) — `orderDetectionService.extractProductInfo()`
3. Chat Message Handling (≥12) — `liveStreamService.handleChatMessage()` (+ WebSocket)
4. Potential Order Management (≥10) — `potentialOrderController.*` (CRUD/filter/stats)
5. Order Auto-Creation (≥15) — `updateOrderStatus()` (status="confirmed"), inventory check, email notification
6. Edge Cases & Error Handling (≥15) — boundaries, null/undefined, DB errors, concurrency
7. Integration & E2E (≥8) — full flow Chat → PotentialOrder → Order confirmed

**ID & Categories**

- Test ID format: `TC-[SuiteNumber][SequentialNumber]` (e.g., TC-101, TC-201)
- Category values: `Happy Path`, `Alternative Path`, `Edge Case`, `Negative Test`, `Error Handling`, `Performance`, `Security`

**Data Standards (Vietnamese realistic data)**
Phones: `0912345678`, `0987654321`, `0355123456` (+ variants with spaces/dots/dashes)  
Messages:

- `Chốt đơn HJ6777 màu đen size 42 sđt 0912345678`
- `Mua 2 đôi size 40 ship cho em 0987654321`
- `Order cái này màu trắng 0355123456`  
  SKUs: `HJ6777`, `NK-HBP-101`, `AD8901`  
  Sizes: Shoes `36–44`; Clothing `XS–XXL`; Accessory `ONESIZE`  
  Colors: `đen`, `trắng`, `đỏ`, `xanh`, `vàng`, `hồng`, `nâu`, `xám`

**Coverage Checklist (must include)**

- Phone + keyword happy paths
- SKU matching (base vs inventory variant)
- Composite parsing (size/color/quantity)
- Missing phone / missing keywords / invalid format
- Multiple phone numbers
- Out-of-stock handling
- Price = 0 or null
- Concurrent operations
- Email failure handling
- Priority calculation
- Flash sale price application
- Featured product fallback
- Security (injection, XSS)

**Constraints**

- Language: Vietnamese prose; English for technical terms, function names, code
- **Test Steps**: BDD style (one line each) → **Given / When / Then** (optional And)
- Use only **concrete** data (no placeholders)
- At least **30% High** priority overall
- Cross-reference related functions/modules in **Dependencies** (from analysis §3–§4)

**Expected Result Formats**

- For `analyzeMessage()`:

```json
{
  "isOrder": true,
  "confidence": 0.75,
  "data": {
    "customerInfo": { "phoneNumber": "0912345678" },
    "productInfo": { "sku": "HJ6777", "extractedSize": "42", "color": "đen", "quantity": 1 }
  }
}
```
