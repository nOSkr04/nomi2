import { protect, authorize } from "../middleware/protect.js";
import { Router } from "express";
import {
  register,
  login,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  logout,
  authMeUser,
  userPrivacy,
  deleteMe,
  onCompleteAllUser,
} from "../controller/users.js";

const router = Router();

//"/api/v1/users"
router.route("/register").post(register);
router.route("/completeUsers").post(onCompleteAllUser);
router.route("/login").post(login);
router.route("/logout").get(protect, logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/privacy").get(userPrivacy);

router.use(protect);

//"/api/v1/users"
router
  .route("/")
  .get(authorize("admin"), getUsers)
  .post(authorize("admin"), createUser);
router.route("/me").get(authMeUser);
router.route("/deleteAccount").post(deleteMe);

router
  .route("/:id")
  .get(authorize("admin", "operator"), getUser)
  .put(authorize("admin"), updateUser)
  .delete(authorize("admin"), deleteUser);

export default router;
