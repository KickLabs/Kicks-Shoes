import express from 'express';
import {
  getAllDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateDiscount,
} from '../controllers/discountController.js';
import { validateDiscountCode } from '../services/discount.service.js';
import { protect, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/active', async (req, res) => {
  try {
    const { getActiveDiscounts } = await import('../services/discount.service.js');
    const discounts = await getActiveDiscounts();

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active discounts',
      error: error.message,
    });
  }
});

// Validate discount code
router.post('/validate', async (req, res) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Discount code is required',
      });
    }

    const result = await validateDiscountCode(code, userId, cartTotal || 0, cartItems || []);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating discount',
      error: error.message,
    });
  }
});

// Protected routes (Admin only)
router.use(protect, requireAdmin);

router.get('/', getAllDiscounts);
router.get('/:id', getDiscountById);
router.post('/', createDiscount);
router.put('/:id', updateDiscount);
router.delete('/:id', deleteDiscount);
router.get('/validate/:code', validateDiscount);

export default router;
