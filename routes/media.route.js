import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";

const router = express.Router();

router.post("/upload-video", upload.single("file"), async (req, res) => {
  try {
    const result = await uploadMedia(req.file.path);
    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result,
    });
  } catch (err) {
    console.log("Erorr in uploadMediaVideo", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || err,
    });
  }
});

export default router;
