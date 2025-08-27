// backend/db.js
import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/document_system"; // بديل محلي عند غياب المتغير

export default async function connectDB() {
  try {
    // تجنّب الاتصال المكرر
    if (mongoose.connection.readyState === 1) {
      console.log("ℹ️ MongoDB already connected");
      return;
    }

    await mongoose.connect(MONGO_URI, {
      // هذه الخيارات مفيدة للإصدارات القديمة؛ الأحدث قد يتجاهلها بلا ضرر
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
    process.exit(1);
  }

  // لالتقاط أي أخطاء لاحقة من الاتصال
  mongoose.connection.on("error", (e) =>
    console.error("Mongo error event:", e?.message || e)
  );
}
