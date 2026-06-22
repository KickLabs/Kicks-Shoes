import express from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
  getActiveDiscounts,
  validateDiscountCode,
} from '../controllers/discountController.js';
import { protect, requireAdmin, optionalAuth } from '../middlewares/auth.middleware.js';


const router = express.Router();


// Public routes (optional auth - will filter by user if authenticated)
router.get('/active', optionalAuth, getActiveDiscounts);
router.post('/validate', validateDiscountCode);


// Protected routes (Admin only)
router.use(protect, requireAdmin);


router.get('/', getAllDiscounts);
router.get('/:id', getDiscountById);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);
router.get('/validate/:code', validateDiscount);


export default router;