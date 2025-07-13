import express from 'express';
import {
  getCart,
  addOrUpdateItem,
  updateCartItem,
  removeCartItem,
} from '../controllers/cartController.js';

import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post('/', addOrUpdateItem);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeCartItem);

export default router;
