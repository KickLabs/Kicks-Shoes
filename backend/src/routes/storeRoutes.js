import express from "express";
import {
  getStores,
  getStoreById,
  updateStore,
} from "../controllers/storeController.js";

const router = express.Router();

router.route("/").get(getStores);

router.route("/:id").get(getStoreById).put(updateStore);

export default router;
