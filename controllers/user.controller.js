import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        error: true,
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "User alreadey exist with this email.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name,
      email: email,
      password: hashPassword,
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully. can you login now",
    });
  } catch (error) {
    console.error("Error registration:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Email or Password",
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect Email or Password ",
        error: true,
      });
    }

    const token = generateToken(user?._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true في الإنتاج
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.name}`,
      user,
      token: token,
    });
  } catch (error) {
    console.error("Error Login:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const logout = async (_, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error Logout:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const UserId = req.userId;

    const user = await User.findById(UserId)
      .select("-password")
      .populate("enrolledCourse");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.error("Error Logout:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { name } = req.body;
    const profilePhoto = req.file;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }
    if (typeof name !== "string" || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 3 characters long",
      });
    }

    if (!profilePhoto) {
      return res
        .status(400)
        .json({ success: false, message: "Profile photo is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // extract public id of the old mage from the url is it exist
    if (user.photoUrl) {
      const publicId = user.photoUrl.split("/").pop().split(".")[0]; // Public id
      deleteMediaFromCloudinary(publicId);
    }

    // upload new photo
    const cloudResponse = await uploadMedia(profilePhoto.path);
    const photoUrl = cloudResponse.secure_url;

    const updateData = { name, photoUrl };
    const updateUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully.",
      success: true,
      user: updateUser,
    });
  } catch (error) {
    console.error("Error updateProfile:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || error,
    });
  }
};
