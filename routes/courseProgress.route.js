import express from "express";
const router = express.Router();
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getCourseProgress,
  markAsCompleted,
  markAsInCompleted,
  updateLectureProgress,
} from "../controllers/courseProgress.controller.js";

router.get("/:courseId", isAuthenticated, getCourseProgress);
router.post(
  "/:courseId/lectures/:lectureId/view",
  isAuthenticated,
  updateLectureProgress
);
router.post("/:courseId/complete", isAuthenticated, markAsCompleted);
router.post("/:courseId/incomplete", isAuthenticated, markAsInCompleted);

export default router;
