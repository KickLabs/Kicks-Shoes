/**
 * @fileoverview Fix All Test Errors Script
 * @created 2025-01-27
 * @file fix-all-test-errors.js
 * @description Script to fix all test errors systematically
 */

import fs from 'fs';
import path from 'path';

const testDir = './tests/discount-flashsale/';
const files = [
  'discount-validation-happy-path.test.js',
  'discount-validation-edge-cases.test.js',
  'flash-sale-pricing-happy-path.test.js',
  'flash-sale-pricing-edge-cases.test.js',
  'flash-sale-status-management.test.js',
  'discount-application.test.js',
  'integration-cart-checkout.test.js',
  'error-handling.test.js',
  'performance.test.js',
  'security.test.js',
  'controller-tests.test.js',
];

// Fix patterns
const fixes = [
  // Remove duplicate jest imports
  {
    pattern:
      /import { jest } from '@jest\/globals';\nimport { jest } from '@jest\/globals';\nimport { jest } from '@jest\/globals';/g,
    replacement: "import { jest } from '@jest/globals';",
  },
  {
    pattern: /import { jest } from '@jest\/globals';\nimport { jest } from '@jest\/globals';/g,
    replacement: "import { jest } from '@jest/globals';",
  },
  // Fix mock setup patterns
  {
    pattern:
      /\/\/ Import after mocking\nconst { [^}]+ } = await import\('\.\.\/\.\.\/src\/services\/[^']+\.js'\);\nconst Discount = \(await import\('\.\.\/\.\.\/src\/models\/Discount\.js'\)\)\.default;\nconst Order = \(await import\('\.\.\/\.\.\/src\/models\/Order\.js'\)\)\.default;/g,
    replacement: `// Import after mocking
const { validateDiscountCode: validateDiscountCodeService } = await import('../../src/services/discount.service.js');
const Discount = (await import('../../src/models/Discount.js')).default;
const Order = (await import('../../src/models/Order.js')).default;`,
  },
  // Fix FlashSale mock setup
  {
    pattern:
      /\/\/ Import after mocking\nconst { [^}]+ } = await import\('\.\.\/\.\.\/src\/services\/[^']+\.js'\);\nconst FlashSale = \(await import\('\.\.\/\.\.\/src\/models\/FlashSale\.js'\)\)\.default;/g,
    replacement: `// Import after mocking
const { calculateFlashSalePrice: calculateFlashSalePriceService, isProductInActiveFlashSale: isProductInActiveFlashSaleService } = await import('../../src/services/flashSale.service.js');
const FlashSale = (await import('../../src/models/FlashSale.js')).default;`,
  },
];

files.forEach(file => {
  const filePath = path.join(testDir, file);

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Apply fixes
    fixes.forEach(fix => {
      content = content.replace(fix.pattern, fix.replacement);
    });

    // Write back
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('All test files fixed!');
