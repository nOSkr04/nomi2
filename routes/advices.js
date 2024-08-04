import express from "express";
import { protect, authorize } from "../middleware/protect.js";

import {
  getAdvices,
  getAdvice,
  createAdvice,
  deleteAdvice,
  updateAdvice,
} from "../controller/advices.js";

const router = express.Router();

//"/advices"
router.route("/").get(getAdvices).post(protect, createAdvice);

router
  .route("/:id")
  .get(protect, getAdvice)
  .delete(protect, authorize("admin", "operator"), deleteAdvice)
  .put(protect, authorize("admin", "operator"), updateAdvice);

export default router;
