/**
 * @fileoverview Fix Remaining Test Files
 * @created 2025-01-27
 * @file fix-remaining-tests.js
 * @description Script to fix remaining test files by removing duplicate imports
 */

import fs from 'fs';
import path from 'path';

const testDir = './tests/discount-flashsale/';
const files = [
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
  // Remove duplicate imports at the top
  {
    pattern:
      /import { jest } from '@jest\/globals';\nimport { [^}]+ } from '\.\.\/\.\.\/src\/services\/[^']+\.js';\nimport [A-Za-z]+ from '\.\.\/\.\.\/src\/models\/[^']+\.js';\nimport [A-Za-z]+ from '\.\.\/\.\.\/src\/models\/[^']+\.js';\n\n\/\/ Mock modules/g,
    replacement: `import { jest } from '@jest/globals';

// Mock modules`,
  },
  // Remove duplicate imports for FlashSale files
  {
    pattern:
      /import { jest } from '@jest\/globals';\nimport { [^}]+ } from '\.\.\/\.\.\/src\/services\/[^']+\.js';\nimport [A-Za-z]+ from '\.\.\/\.\.\/src\/models\/[^']+\.js';\n\n\/\/ Mock modules/g,
    replacement: `import { jest } from '@jest/globals';

// Mock modules`,
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

console.log('All remaining test files fixed!');
