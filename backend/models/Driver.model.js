import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    // الاسم الرباعي + اللقب
    first: { type: String, required: true },         // الاسم
    father: { type: String, required: true },        // الأب
    grandfather: { type: String, required: true },   // الجد
    fourth: { type: String, required: true },        // الرابع
    last: { type: String, required: true },          // اللقب
    fullName: { type: String, required: true, unique: true },

    // أم السائق
    motherFirst: { type: String, required: true },       // اسم الأم
    motherFather: { type: String, required: true },      // أب الأم
    motherGrandfather: { type: String, required: true }, // جد الأم

    // الميلاد، الهوية، العنوان
    birthDate: { type: String, required: true }, // YYYY-MM-DD
    nationalId: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{12}$/.test(v),
        message: "رقم البطاقة الوطنية يجب أن يتكوّن من 12 رقمًا",
      },
    },
    province: { type: String, required: true },
    areaAddress: { type: String, required: true },

    // الاتصال والرخصة
    phone: { type: String, required: true },
    licenseEnd: { type: String, required: true },

    // صور الرخصة
    frontImage: String, // وجه رخصة السوق
    backImage: String,  // خلف رخصة السوق

    // صور البطاقة الوطنية
    idFrontImage: String,
    idBackImage: String,
  },
  { timestamps: true }
);

// مهم: استخدم function العادية وليس السهمية لكي يعمل this بشكل صحيح
driverSchema.pre("save", function (next) {
  const parts = [this.first, this.father, this.grandfather, this.fourth, this.last]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  this.fullName = parts;
  next();
});

export default mongoose.model("Driver", driverSchema);
