import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    const dbURL = process.env.MONGO_URL;
    if (!dbURL) {
      throw new Error("❌ DATABASE_URL is not defined in .env file");
    }

    await mongoose.connect(dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ Database Connection error: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
