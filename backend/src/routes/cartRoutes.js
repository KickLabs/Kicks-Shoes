import express from "express";
import {
  getCart,
  addOrUpdateItem,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController.js";

import { protect } from "../middlewares/auth.middleware.js"; 

const router = express.Router();


router.use(protect);

router.get("/", getCart);
router.post("/items", addOrUpdateItem);
router.put("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", removeCartItem);

export default router;
