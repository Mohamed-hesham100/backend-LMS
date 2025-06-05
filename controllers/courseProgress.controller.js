import Course from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.js";



export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    // step-1: fetch the user's course progress
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    }).populate("courseId");

    const courseDetails = await Course.findById(courseId).populate("lectures");
    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // step-2: if no progress found, return course details with empty progress
    if (!courseProgress) {
      return res.status(200).json({
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    // step-3: return progress
    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgress,
        completed: courseProgress.completed,
      },
    });
  } catch (err) {
    console.error("Error in getCourseProgress", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};


export const updateLectureProgress = async (req, res) => {
  const { courseId, lectureId } = req.params;
  const userId = req.userId;

  try {
    let courseProgress = await CourseProgress.findOne({ userId, courseId });

    if (!courseProgress) {
      courseProgress = new CourseProgress({
        userId,
        courseId,
        lectureProgress: [{ lectureId, viewed: true }],
      });
    } else {
      const lecture = courseProgress.lectureProgress.find(
        (lecture) => lecture.lectureId === lectureId
      );

      if (lecture) {
        lecture.viewed = true;
      } else {
        courseProgress.lectureProgress.push({ lectureId, viewed: true });
      }
    }

    //  عدد المحاضرات الحقيقي من الكورس
    const course = await Course.findById(courseId)
      .select("lectures")
      .populate("lectures");
    const totalLectures = course.lectures.length;

    // عدد المحاضرات اللي اتشافت
    const viewedLectures = courseProgress.lectureProgress.filter(
      (lecture) => lecture.viewed
    ).length;

    courseProgress.completed = viewedLectures === totalLectures;

    await courseProgress.save();
    return res.status(200).json({
      success: true,
      message: "Lecture progress updated successfully.",
    });
  } catch (err) {
    console.error("Error in updateLectureProgress", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    // Mark all lectures as viewed
    courseProgress.lectureProgress = courseProgress.lectureProgress.map(
      (lectureProgress) => ({
        ...lectureProgress,
        viewed: true,
      })
    );

    courseProgress.completed = true;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as completed.",
    });
  } catch (err) {
    console.error("Error in markAsCompleted", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    // Mark all lectures as viewed
    courseProgress.lectureProgress = courseProgress.lectureProgress.map(
      (lectureProgress) => ({
        ...lectureProgress,
        viewed: false,
      })
    );

    courseProgress.completed = false;

    await courseProgress.save();

    return res.status(200).json({
      success: true,
      message: "Course marked as incompleted.",
    });
  } catch (err) {
    console.error("Error in markAsInCompleted", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
