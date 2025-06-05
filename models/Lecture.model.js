import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
      // trim: true,
      // maxlength: 100,
    },
    videoUrl: {   
      type: String,
    },
    publicId: {
      type: String,
    },
    isPreviewFree: {
      type: Boolean,
      default: false,  
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course", 
    },
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);
