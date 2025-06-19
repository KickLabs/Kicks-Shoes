import express from "express";
import {
  addToFavourites,
  removeFromFavourites,
  getFavourites,
  checkFavourite,
  getFavouritesByUserId
} from "../controllers/favouriteController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route("/")
  .get(getFavourites)
  .post(addToFavourites);

router.route("/:productId")
  .delete(removeFromFavourites);

router.route("/check/:productId")
  .get(checkFavourite);

router.route("/user/:userId")
  .get(getFavouritesByUserId);

export default router; 