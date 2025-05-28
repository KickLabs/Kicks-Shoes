import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getUsers).post(protect, authorize("admin"), createUser);

router.route("/:id").get(getUser).put(protect, authorize("admin"), updateUser).delete(protect, authorize("admin"), deleteUser);

export default router;
