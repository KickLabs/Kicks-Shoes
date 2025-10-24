# Prompt: Increasing test coverage

I want to increase the unit test coverage for the following file:

`<FILE_PATH>`

Goal:

- Increase coverage to **≥ 90%** for this file
- Include tests for: Happy Path, Edge Cases, Error Handling, and Branch Coverage

Your task:

1. Analyze all functions and detect non-covered branches
2. Generate new additional Jest tests to improve coverage
3. Do NOT rewrite my existing tests — generate only missing tests
4. Return the output as a single `.test.js` code block

Output format:

- A short coverage gap analysis section
- New Jest test cases needed to reach ≥ 90% coverage
- Code block: `// FILE: <FILE_NAME>.additional.test.js`

Best Practice:

- Include assertions to cover branches, conditionals, early returns, and thrown errors.

# Prompt: Debug & Fix Failing Unit Test

````
Help me fix this failing unit test.

ERROR:
[PASTE ERROR LOG HERE]

TEST CODE:
```js
[PASTE TEST CODE HERE]
````

SOURCE CODE:

```js
[PASTE SOURCE CODE HERE]
```

Please provide:

1. **Root Cause** — Why it fails
2. Issue in **test or source code?**
3. **Fixed version** (test and/or source)
4. Working corrected example
5. Short **Given–When–Then** explanation for the fix

```

```

# Prompt: Generate Mocks

"Create high-quality Jest mock objects for all external dependencies used in the **Order in Livestream** feature.

Your tasks:

- Generate Jest mock modules for the following dependencies:
  - ProductService.getProductBySku(sku)
  - InventoryService.reserveStock(productId, quantity)
  - UserService.getUserById(userId)
  - LiveStreamService.sendNotification(streamId, payload)
  - OrderService.createOrder(orderData)
  - EmailService.sendOrderConfirmation(email, orderData)

Requirements:

- Include **realistic Vietnamese test data** for products, users, livestream messages, and orders
- Provide **proper mock setup & teardown** (beforeAll, beforeEach, afterEach, afterAll)
- Ensure mocks support both:
  - Happy path responses
  - Error/exception simulation (e.g., out of stock, DB error, email failure)
- Include default mock return values + methods for overriding (e.g. `__set`, `__reset`, `__throw`)

Expected Output:

1. Mock files for each service (e.g., `productService.mock.js`, `userService.mock.js`, etc.)
2. A shared `testUtils.js` with reusable helpers:
   - `makeMessage(content, overrides)`
   - `makeStream(overrides)`
   - `makeUser(overrides)`
   - `mockDate(timestamp)`
3. Sample test snippet demonstrating how to use the mocks within `Order in Livestream` test suites

Best Practice:

- Use in-memory Maps for deterministic state
- Always reset mock state between tests
- Provide at least 3 mock scenarios per service:
  1. Successful response
  2. Edge case or no data found
  3. Error thrown or rejected Promise (for Error Handling test suites)"
