import express from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount
} from '../controllers/discountController.js';

const router = express.Router();

// Get all discounts with optional filtering
// GET /api/discounts?isActive=true&page=1&limit=10&category=categoryId&product=productId
router.get('/', getAllDiscounts);

// Get single discount by ID
// GET /api/discounts/:id
router.get('/:id', getDiscountById);

// Validate discount code
// GET /api/discounts/validate/:code
router.get('/validate/:code', validateDiscount);

// Create new discount
// POST /api/discounts
router.post('/', createDiscount);

// Update discount
// PUT /api/discounts/:id
router.put('/:id', updateDiscount);

// Delete discount
// DELETE /api/discounts/:id
router.delete('/:id', deleteDiscount);

export default router; 