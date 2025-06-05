import express from "express";
import upload from "../utils/multer.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCourse,
  getCreatorCourses,
  editCourse,
  getCourseById,
  createLecture,
  getCourseLecture,
  editLecture,
  deleteLecture,
  getLectureById,
  togglePublishCourse,
  getPublishedCoures,
  searchCourse,
} from "../controllers/course.controller.js";

const router = express.Router();

//  Courses Routes
router.get("/search", isAuthenticated, searchCourse);
router.get("/published-courses", getPublishedCoures);
router.get("/", isAuthenticated, getCreatorCourses);
router.post("/", isAuthenticated, createCourse);
router.get("/:courseId", isAuthenticated, getCourseById);
router.put(
  "/:courseId",
  isAuthenticated,
  upload.single("courseThumbnail"),
  editCourse
);
router.put("/:courseId/publish", isAuthenticated, togglePublishCourse);

//  Lectures Routes
router.post("/:courseId/lecture", isAuthenticated, createLecture);
router.get("/:courseId/lecture", isAuthenticated, getCourseLecture);
router.post("/:courseId/lecture/:lectureId", isAuthenticated, editLecture);
router.delete("/lecture/:lectureId", isAuthenticated, deleteLecture);
router.get("/lecture/:lectureId", isAuthenticated, getLectureById);

// Optional: Delete entire course route (commented out)
// router.delete("/:id", deleteCourse);

export default router;
