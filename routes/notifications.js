import { Router } from "express";
const router = Router();
import { protect, authorize } from "../middleware/protect.js";

import {
  allUserNotification,
  createNotification,
  deleteNotification,
  getNotification,
} from "../controller/notification.js";

//"/api/v1/wallets"
router
  .route("/")
  .get(protect, getNotification)
  .post(protect, createNotification);
router.route("/all").post(protect, allUserNotification);
router.route("/:id").delete(protect, authorize("admin"), deleteNotification);

export default router;
