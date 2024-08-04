import { Router } from "express";
import { uploadVideo } from "../controller/media.js";

const router = Router();

router.route("/video").post(uploadVideo);

export default router;
