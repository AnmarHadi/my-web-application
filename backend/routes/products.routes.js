import express from "express";
import Product from "../models/Product.model.js";

const router = express.Router();

// جلب جميع المنتجات
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });
    res.json(products.map((prod) => ({
      id: prod._id,
      name: prod.name
    })));
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب المنتجات" });
  }
});

// إضافة منتج جديد
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم المنتوج مطلوب" });
    }
    // منع التكرار
    if (await Product.findOne({ name })) {
      return res.status(409).json({ error: "اسم المنتوج موجود مسبقاً" });
    }
    const prod = await Product.create({ name: name.trim() });
    res.status(201).json({ id: prod._id, name: prod.name });
  } catch (err) {
    res.status(500).json({ error: "فشل في إضافة المنتوج" });
  }
});

// تعديل منتج
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم المنتوج مطلوب" });
    }
    // تحقق من عدم وجود منتج بنفس الاسم (عدا الحالي)
    if (await Product.findOne({ name, _id: { $ne: req.params.id } })) {
      return res.status(409).json({ error: "اسم المنتوج مستخدم مسبقاً" });
    }
    const prod = await Product.findByIdAndUpdate(req.params.id, { name: name.trim() }, { new: true });
    if (!prod) return res.status(404).json({ error: "لم يتم العثور على المنتوج" });
    res.json({ id: prod._id, name: prod.name });
  } catch (err) {
    res.status(500).json({ error: "فشل في تعديل المنتوج" });
  }
});

// حذف منتج
router.delete("/:id", async (req, res) => {
  try {
    const prod = await Product.findByIdAndDelete(req.params.id);
    if (!prod) return res.status(404).json({ error: "المنتوج غير موجود" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في حذف المنتوج" });
  }
});

export default router;
