import Stripe from "stripe";
import Course from "../models/course.model.js";
import CoursePurchase from "../models/coursePurchase.model.js";
import { Lecture } from "../models/Lecture.model.js";
import User from "../models/user.models.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.courseTitle,
              images: [course.courseThumbnail],
            },
            unit_amount: course.coursePrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/course-progress/${courseId}`,
      cancel_url: `${process.env.CLIENT_URL}/course-details/${courseId}`,
      metadata: { userId, courseId }, // مهم جداً لنستخدمه في webhook
    });

    if (!session || !session.url) {
      return res
        .status(400)
        .json({ success: false, message: "Error creating checkout session" });
    }

    const newPurchase = new CoursePurchase({
      userId,
      courseId,
      paymentId: session.id,
      price: course.coursePrice,
      amount: course.coursePrice,
      status: "pending",
    });

    await newPurchase.save();
    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Checkout session error.",
    });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;
  try {
    const signature = req.headers["stripe-signature"];
    const secret = process.env.WEBHOOK_ENDPOINT_SECRET;

    event = stripeInstance.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const { userId, courseId } = session.metadata;

      let purchase = await CoursePurchase.findOne({ paymentId: session.id });

      if (!purchase) {
        // إذا لم يتم إنشاء CoursePurchase مسبقاً (لأي سبب)، ننشئه الآن
        purchase = new CoursePurchase({
          userId,
          courseId,
          paymentId: session.id,
          price: session.amount_total / 100,
          amount: session.amount_total / 100,
          status: "completed",
        });
      } else {
        // تحديث الحالة والمبلغ
        purchase.status = "completed";
        purchase.amount = session.amount_total / 100;
      }

      await purchase.save();

      // إضافة الطالب إلى الكورس وتحديث المحاضرات
      await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourse: courseId },
      });
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: userId },
      });

      const course = await Course.findById(courseId);
      if (course && course.lectures.length > 0) {
        await Lecture.updateMany(
          { _id: { $in: course.lectures } },
          { $set: { isPreviewFree: true } }
        );
      }

      res.status(200).json({
        success: true,
        message: "Payment processed and course access granted.",
      });
    } catch (err) {
      console.error("Error processing webhook:", err);
      res
        .status(500)
        .json({ success: false, message: "Webhook processing failed" });
    }
  } else {
    res.status(200).send("Unhandled event type");
  }
};

export const getCourseDetailsWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;
    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" })
      .populate({ path: "enrolledStudents", select: "-password" });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "course not found.",
      });
    }

    const purchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    return res.status(200).json({
      course,
      purchased: !!purchased, //true if purchased, false otherwise
    });
  } catch (error) {
    console.log(
      "Error in get CourseDetails With PurchaseStatus",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const purchasedCourse = await CoursePurchase.find({
      status: "completed",
    }).populate("courseId");
    if (purchasedCourse.length === 0) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }

    return res.status(200).json({
      success: true,
      purchasedCourse,
    });
  } catch (error) {
    console.log("Error in get All PurchasedCourse", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = req.userId;

    // جلب الكورسات التي أنشأها المستخدم
    const courses = await Course.find({ creator: instructorId });
    const coursePurchase = await CoursePurchase.find({
      userId: instructorId,
      status: "completed",
    });

    // استخراج الـ IDs الخاصة بالكورسات
    const courseIds = courses.map((course) => course._id);

    // جلب عمليات الشراء المرتبطة بهذه الكورسات
    const purchases = await CoursePurchase.find({
      courseId: { $in: courseIds },
      status: "completed",
    }).populate("courseId");


    // حساب عدد الطلاب (عدد الشراءات)
    const totalStudents = purchases.length;

    // حساب الإيرادات
    const totalRevenue = purchases.reduce((acc, p) => acc + (p.amount || 0), 0);

    const dailyRevenueMap = {};

    // حساب الإيرادات اليومية
    purchases.forEach((purchase) => {
      const date = new Date(purchase.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dailyRevenueMap[date]) dailyRevenueMap[date] = 0;
      dailyRevenueMap[date] += purchase.amount || 0;
    });

    const dailyRevenue = Object.entries(dailyRevenueMap).map(
      ([date, value]) => ({
        date,
        value,
      })
    );

    // الكورسات التي تم بيعها (مكتملة فقط) بدون تكرار
    const soldCourses = [ ...new Map(purchases.map((p) => [p.courseId._id.toString(), p.courseId]) ).values(),
    ];

    return res.status(200).json({
      success: true,
      totalCourses: courses.length,
      totalStudents,
      totalRevenue,
      purchasedCourse: purchases,
      soldCourses,
      dailyRevenue,
      coursePurchase,
    });
  } catch (error) {
    console.error("Error in instructor dashboard", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
