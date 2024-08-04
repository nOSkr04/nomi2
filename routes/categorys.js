import express from "express";
import { protect, authorize } from "../middleware/protect.js";

import {
  getCategorys,
  getCategory,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controller/category.js";

const router = express.Router();

//"/categorys"
router.route("/").get(getCategorys).post(createCategory);

router
  .route("/:id")
  .get(getCategory)
  .delete(protect, authorize("admin", "operator"), deleteCategory)
  .put(protect, authorize("admin", "operator"), updateCategory);

export default router;
