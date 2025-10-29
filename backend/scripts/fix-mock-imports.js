/**
 * @fileoverview Fix Mock Imports Script
 * @created 2025-01-27
 * @file fix-mock-imports.js
 * @description Script to fix mock import issues in test files
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
  {
    pattern:
      /import Discount from '\.\.\/\.\.\/src\/models\/Discount\.js';\nimport Order from '\.\.\/\.\.\/src\/models\/Order\.js';\n\n\/\/ Mock modules/g,
    replacement: `// Mock modules`,
  },
  {
    pattern:
      /\/\/ Import after mocking\nconst { [^}]+ } = await import\('\.\.\/\.\.\/src\/services\/[^']+\.js'\);\nconst Discount = \(await import\('\.\.\/\.\.\/src\/models\/Discount\.js'\)\)\.default;\nconst Order = \(await import\('\.\.\/\.\.\/src\/models\/Order\.js'\)\)\.default;/g,
    replacement: `// Import after mocking
const { validateDiscountCode: validateDiscountCodeService } = await import('../../src/services/discount.service.js');
const Discount = (await import('../../src/models/Discount.js')).default;
const Order = (await import('../../src/models/Order.js')).default;`,
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
