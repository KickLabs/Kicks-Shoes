/**
 * @fileoverview Fix Test Imports Script
 * @created 2025-01-27
 * @file fix-test-imports.js
 * @description Script to fix common import issues in test files
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
    pattern: /import { calculateFlashSalePrice, getProductFlashSale } from/g,
    replacement: 'import { calculateFlashSalePrice, isProductInActiveFlashSale } from',
  },
  {
    pattern: /getProductFlashSale: getProductFlashSaleService/g,
    replacement: 'isProductInActiveFlashSale: isProductInActiveFlashSaleService',
  },
  {
    pattern: /getProductFlashSaleService/g,
    replacement: 'isProductInActiveFlashSaleService',
  },
  {
    pattern: /getProductFlashSale\(/g,
    replacement: 'isProductInActiveFlashSale(',
  },
  {
    pattern: /^import {/gm,
    replacement: "import { jest } from '@jest/globals';\nimport {",
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
