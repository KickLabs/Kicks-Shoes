# Prompt 3: Generate Jest Test Code

"Read the Test Case Matrix file and generate runnable Jest test code for **one selected Test Suite** of the _Order in Livestream_ feature.

## Inputs

- **Test matrix file path:** `<ABSOLUTE_PATH_TO_MATRIX_MD>`  
  Example: `D:\Workspace\Kicks-Shoes\backend\prompts\output_phase2.md`
- **Suite heading (exact or case-insensitive match):** `<SUITE_HEADING>`  
  Example: `Test Suite 3: Chat Message Handling`

## Your Task

- Parse the `<SUITE_HEADING>` section from the Test Case Matrix.
- For **each test case** under that suite, create **one** corresponding `test()` block in Jest.
- Test name must keep the **Test ID prefix**: `TC-xxx | <concise scenario>`.
- Use **Given–When–Then** structure as comments inside each test.
- Map the correct Subject Under Test based on the suite:

| Suite   | Subject Under Test                                                              |
| ------- | ------------------------------------------------------------------------------- |
| Suite 1 | `orderDetection.service.analyzeMessage(messageData, streamData, userData)`      |
| Suite 2 | `orderDetection.service.extractProductInfo(rawMessage, streamData)`             |
| Suite 3 | `liveStreamService.handleChatMessage(socketId, messageData)` (+ Socket.IO mock) |
| Suite 4 | `potentialOrderController.*` (CRUD / filter / stats)                            |
| Suite 5 | `updateOrderStatus(req,res)` + `OrderService.createOrder(orderData)`            |
| Suite 6 | Cross-service edge/error handling                                               |
| Suite 7 | E2E Integration (Express + Supertest + Socket.IO client with mocks)             |

## Output Requirements (code only)

Generate the following files:

1. `tests/<suite-slug>.test.js`

   - `<suite-slug>` = lowercase suite title, spaces and “&” replaced with hyphens (e.g., `chat-message-handling`).
   - Use: `describe('Order in Livestream — <SUITE_HEADING>', ...)`
   - One `test()` per test case (no merging, no missing tests).
   - Assertions must reflect the “Expected Result” from the matrix (return values, DB mock updates, socket events, etc.).
   - Include **Given / When / Then** comments in each test.

2. `tests/mocks/productService.mock.js`

   - Provide an in-memory mock module with: `findOneBySku`, `findOneByInventorySku`, `__set`, `__clear`.

3. `tests/_helpers/testUtils.js`

   - Include helpers: `makeMessage`, `makeStream`, `makeUser`, `normalizePhone`, `perf(fn)`.

4. `prompts/log.md`

   - Append this entry:  
     `YYYY-MM-DD HH:mm | Generated tests for "<SUITE_HEADING>" (N cases)`

5. `README.md`
   - Add test execution guide if missing:  
     `npm test -- --coverage`

## Requirements

- Use **Jest** (CommonJS). No additional test libraries.
- Include setup/teardown (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`).
- Use proper assertions: `toEqual`, `toBe`, `toThrow`, `toHaveBeenCalledWith`, etc.
- Test names must be clear, descriptive, and start with **TC-ID**.
- Mock all external I/O (DB, network, email, Socket.IO).
- Tests must be **deterministic**, CI-friendly, target ≥ 80% coverage.
- Output only the code files listed above — no extra explanation.

## Sample Suite Headings

- `"Test Suite 1: Message Analysis & Order Detection"`
- `"Test Suite 3: Chat Message Handling"`

---

### Save Time with AI

- AI generates test templates → You review & refine assertions
- AI suggests realistic mock data → You validate accuracy (SKU, phone, size/color)
- AI writes boilerplate & mocks → You focus on logic & edge cases
  "
