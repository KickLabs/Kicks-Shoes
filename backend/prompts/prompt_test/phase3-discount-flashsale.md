# Prompt 3: Generate Jest Test Code for Discounts & Flash Sales

"Read the Test Case Matrix file and generate runnable Jest test code for **one selected Test Suite** of the ## 9) Discounts & Flash Sales

Modules: controllers/discountController.js, services/discount.service.js, models/Discount.js, controllers/flashSaleController.js, services/flashSale.service.js, models/FlashSale.js

- Unit
  - Discount validation: percent/range/active windows; stackability with other promos.
  - Flash sale timing: active window detection; per-product overrides; get best price.
- Integration
  - Apply discount in cart/order flows; flash sale price on product detail/list.
- Edge
  - Overlapping discounts; expired promos; inventory reserved for sale.
    feature.

## Inputs

- **Test matrix file path:** `D:\ai4se\Kicks-Shoes\backend\tests\discount-flashsale\output_prompt\test-cases-matrix-discountflashsale.md`
- **Suite heading (exact or case-insensitive match):** `<SUITE_HEADING>`  
  Example: `DISCOUNT VALIDATION - HAPPY PATH`

## Your Task

- Parse the `<SUITE_HEADING>` section from the Test Case Matrix.
- For **each test case** under that suite, create **one** corresponding `test()` block in Jest.
- Test name must keep the **Test ID prefix**: `DV-xxx | <concise scenario>`.
- Use **Given–When–Then** structure as comments inside each test.
- Map the correct Subject Under Test based on the suite:

| Suite                             | Subject Under Test                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| DISCOUNT VALIDATION - HAPPY PATH  | `discount.service.validateDiscountCode(code, userId, cartTotal, cartItems)`             |
| DISCOUNT VALIDATION - EDGE CASES  | `discount.service.validateDiscountCode(code, userId, cartTotal, cartItems)`             |
| FLASH SALE PRICING - HAPPY PATH   | `flashSale.service.calculateFlashSalePrice(originalPrice, discountPercent, flashPrice)` |
| FLASH SALE PRICING - EDGE CASES   | `flashSale.service.calculateFlashSalePrice(originalPrice, discountPercent, flashPrice)` |
| FLASH SALE STATUS - HAPPY PATH    | `flashSale.service.updateFlashSaleStatuses()`                                           |
| FLASH SALE STATUS - EDGE CASES    | `flashSale.service.updateFlashSaleStatuses()`                                           |
| DISCOUNT APPLICATION - HAPPY PATH | `discount.service.applyDiscountToOrder(orderId, discountCode)`                          |
| DISCOUNT APPLICATION - EDGE CASES | `discount.service.applyDiscountToOrder(orderId, discountCode)`                          |
| INTEGRATION - CART/CHECKOUT       | Cross-service integration with cart/checkout flows                                      |
| INTEGRATION - UI COMPONENTS       | Frontend component integration tests                                                    |
| ERROR HANDLING                    | Error handling across all services                                                      |
| PERFORMANCE                       | Performance testing for high-load scenarios                                             |
| SECURITY                          | Security testing for input validation and authorization                                 |

## Output Requirements (code only)

Generate the following files:

1. `tests/discount-flashsale/<suite-slug>.test.js`

   - `<suite-slug>` = lowercase suite title, spaces and "&" replaced with hyphens (e.g., `discount-validation-happy-path`).
   - Use: `describe('Discounts & Flash Sales — <SUITE_HEADING>', ...)`
   - One `test()` per test case (no merging, no missing tests).
   - Assertions must reflect the "Expected Result" from the matrix (return values, DB mock updates, etc.).
   - Include **Given / When / Then** comments in each test.

2. `tests/discount-flashsale/mocks/discountService.mock.js`

   - Provide an in-memory mock module with: `validateDiscountCode`, `applyDiscountToOrder`, `getActiveDiscounts`, `__set`, `__clear`.

3. `tests/discount-flashsale/_helpers/testUtils.js`

   - Include helpers: `makeDiscount`, `makeFlashSale`, `makeOrder`, `makeProduct`, `makeUser`, `normalizePhone`, `perf(fn)`.

4. `prompts/log.md`

   - Append this entry:  
     `YYYY-MM-DD HH:mm | Generated tests for "<SUITE_HEADING>" (N cases)`

5. `README.md`
   - Add test execution guide if missing:  
     `npm test -- --coverage`

## Requirements

- Use **Jest** (ESM modules). No additional test libraries.
- Include setup/teardown (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`).
- Use proper assertions: `toEqual`, `toBe`, `toThrow`, `toHaveBeenCalledWith`, etc.
- Test names must be clear, descriptive, and start with **Test ID**.
- Mock all external I/O (DB, network, email, Socket.IO).
- Tests must be **deterministic**, CI-friendly, target ≥ 80% coverage.
- Output only the code files listed above — no extra explanation.

## Sample Suite Headings

- `"DISCOUNT VALIDATION - HAPPY PATH"`
- `"FLASH SALE PRICING - HAPPY PATH"`
- `"INTEGRATION - CART/CHECKOUT"`

---

### Save Time with AI

- AI generates test templates → You review & refine assertions
- AI suggests realistic mock data → You validate accuracy (discount codes, prices, dates)
- AI writes boilerplate & mocks → You focus on logic & edge cases
