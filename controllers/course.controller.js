import Course from "../models/course.model.js";
import { Lecture } from "../models/Lecture.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";

export const createCourse = async (req, res) => {
  try {
    const { courseTitle, category } = req.body;
    if (!courseTitle || !category) {
      return res.status(400).json({
        message: "Course title and category is required",
        success: false,
      });
    }

    const course = new Course({
      courseTitle,
      category,
      creator: req.userId,
    });

    await course.save();

    return res.status(200).json({
      course,
      message: "Course created.",
      success: true,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      message: error.message || error,
      success: false,
    });
  }
};

export const getCreatorCourses = async (req, res) => {
  try {
    const userId = req.userId;
    const courses = await Course.find({ creator: userId });
    if (!courses) {
      return res.status(404).json({
        course: [],
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.log("Error in getCreatorCourses", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    return res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const editCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
    } = req.body;
    const thumbnail = req.file;

    // // ✅ Improved validation: Check if any field is missing
    // if (
    //   !courseTitle ||
    //   !subTitle ||
    //   !description ||
    //   !category ||
    //   !courseLevel ||
    //   coursePrice === undefined ||
    //   coursePrice === null ||
    //   coursePrice === ""
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "All fields are required",
    //   });
    // }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let courseThumbnail;
    if (thumbnail) {
      if (course.courseThumbnail) {
        const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
        await deleteMediaFromCloudinary(publicId); // delete old image
      }
      courseThumbnail = await uploadMedia(thumbnail.path);
    }

    const updatedData = {
      courseTitle,
      subTitle,
      description,
      category,
      courseLevel,
      coursePrice,
      courseThumbnail: courseThumbnail?.secure_url || course.courseThumbnail,
    };

    const updateCourse = await Course.findByIdAndUpdate(courseId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      updateCourse,
    });
  } catch (error) {
    console.log("Error in updated course.", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || error,
    });
  }
};

// export const deleteCourse = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const deletedCourse = await Course.findByIdAndDelete(courseId);
//     if (!deletedCourse)
//       return res.status(404).json({ message: "Course not found" });
//     res.status(200).json({ message: "Course deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error deleting course", error: error.message });
//   }
// };

export const createLecture = async (req, res) => {
  try {
    const { lectureTitle } = req.body;
    const { courseId } = req.params;

    if (!lectureTitle || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Lecture title and course ID are required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lecture = await Lecture.create({
      lectureTitle: lectureTitle,
      courseId: courseId,
    });

    course.lectures.push(lecture._id);
    await course.save();

    return res.status(201).json({
      success: true,
      message: "Lecture created successfully",
      lecture,
      course,
    });
  } catch (error) {
    console.error("Error creating Lecture:", error);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const getCourseLecture = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate("lectures");
    if (!course) {
      return res.status(404).json({
        success: true,
        message: "Course not found",
      });
    }
    return res.status(200).json({
      success: true,
      lecture: course.lectures,
    });
  } catch (error) {
    console.error("Error to get courseLecture:", error);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const editLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { lectureTitle, videoInfo, isPreviewFree } = req.body;
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found!",
      });
    }

    if (lectureTitle) {
      lecture.lectureTitle = lectureTitle;
    }
    if (videoInfo.videoUrl) {
      lecture.videoUrl = videoInfo.videoUrl;
    }
    if (videoInfo.publicId) {
      lecture.publicId = videoInfo.publicId;
    }
    if (isPreviewFree !== undefined) {
      lecture.isPreviewFree = isPreviewFree;
    }

    await lecture.save();

    const course = await Course.findById(courseId);
    if (course && !course.lectures.includes(lecture._id)) {
      course.lectures.push(lecture._id);
      await course.save();
    }

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully.",
      lecture,
    });
  } catch (error) {
    console.log("Error in updated lecture.", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) return res.status(404).json({ message: "lecture not found" });

    // delete the lecture from cloudinary
    if (lecture.publicId) {
      await deleteVideoFromCloudinary(lecture.publicId);
    }

    // Remove the lecture refrence from the associated course
    await Course.updateOne(
      { lectures: lectureId },
      { $pull: { lectures: lectureId } } // Remove the lectures id from the lecture arry
    );
    return res
      .status(200)
      .json({ success: true, message: "Lecture deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId);

    if (!lecture)
      return res
        .status(404)
        .json({ success: false, message: "Lecture not found" });

    return res.status(200).json({
      success: true,
      lecture,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

// publich unpublish course logic
export const togglePublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { publish } = req.query; // true or false
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found!",
      });
    }

    // publish status based on the query paramter
    course.isPublished = publish === "true";
    await course.save();
    const statusMessage = course.isPublished ? "published" : "Unpublished";
    return res.status(200).json({
      success: true,
      message: `Course is ${statusMessage}`,
    });
  } catch (error) {
    console.log("Error in togglePublishCourse ", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const getPublishedCoures = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: "creator",
      select: "name photoUrl",
    });

    if (!courses || courses.length === 0 || courses === undefined) {
      return res.status(404).json({
        success: false,
        message: "No published courses found.",
      });
    }

    return res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.log("Error in getPublishedCoures ", error.message);
    return res.status(400).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const searchCourse = async (req, res) => {
  try {
    const { query = "", sortByPrice = "" } = req.query;

    const rawCategories = req.query.categories;
    const categories = Array.isArray(rawCategories)
      ? rawCategories
      : typeof rawCategories === "string"
      ? rawCategories.split(",")
      : [];

    const searchCriteria = {
      isPublished: true,
      $or: [
        { courseTitle: { $regex: query, $options: "i" } },
        { subTitle: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };

    if (categories.length > 0) {
      searchCriteria.category = { $in: categories };
    }

    const sortOptions = {};
    if (sortByPrice === "low") {
      sortOptions.coursePrice = 1;
    } else if (sortByPrice === "high") {
      sortOptions.coursePrice = -1;
    }

    const courses = await Course.find(searchCriteria)
      .populate({ path: "creator", select: "name photoUrl" })
      .sort(sortOptions);

    return res.status(200).json({
      success: true,
      courses: courses || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
