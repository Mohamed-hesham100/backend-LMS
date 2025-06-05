import express from "express";
const router = express.Router();
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailsWithPurchaseStatus,
  getInstructorDashboard,
  stripeWebhook,
} from "../controllers/coursePurchase.controller.js";

router.post("/webhook", stripeWebhook);

router.post(
  "/checkout/create-checkout-session",
  isAuthenticated,
  createCheckoutSession
);
router.get(
  "/course/:courseId/details-with-status",
  isAuthenticated,
  getCourseDetailsWithPurchaseStatus
);

router.route("/").get(isAuthenticated, getAllPurchasedCourse);
router.get("/getInstructorDashboard", isAuthenticated, getInstructorDashboard);

export default router;
