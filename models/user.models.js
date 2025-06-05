import mongoose, { mongo } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      // trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      // lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      // minlength: 6
    },
    role: {
      type: String,
      enum: ["instructor", "student"],
      default: "student",
    },
    enrolledCourse: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    photoUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

export default User;
