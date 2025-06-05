import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import bodyParser from "body-parser";

import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRouter from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
dotenv.config();
const app = express();

// Middleware for Stripe webhook raw body BEFORE express.json
app.use(
  "/api/v1/purchase/webhook",
  bodyParser.raw({ type: "application/json" })
);

// Default middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
  })
);

// Connect to database
connectDB();

// API routes
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);

app.get("/", (req, res) => {
  res.send("🚀 Backend API is running...");
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🟢 Server is running on http://localhost:${PORT}`);
});
