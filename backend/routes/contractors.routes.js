// backend/routes/contractors.routes.js
import express from "express";
import Contractor from "../models/Contractor.model.js";

const router = express.Router();

// جلب كل المتعهدين
router.get("/", async (req, res) => {
  try {
    const contractors = await Contractor.find().sort({ createdAt: -1 });
    res.json(contractors);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب المتعهدين" });
  }
});

// إضافة متعهد
router.post("/", async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone || !address)
      return res.status(400).json({ error: "يرجى إدخال جميع الحقول" });

    const existsName = await Contractor.findOne({ name });
    if (existsName) return res.status(409).json({ error: "اسم المتعهد موجود بالفعل" });

    const existsPhone = await Contractor.findOne({ phone });
    if (existsPhone) return res.status(409).json({ error: "رقم الهاتف مستخدم مسبقاً" });

    const contractor = new Contractor({ name, phone, address });
    await contractor.save();
    res.status(201).json(contractor);
  } catch (err) {
    res.status(500).json({ error: "فشل في إضافة المتعهد" });
  }
});

// تعديل متعهد
router.put("/:id", async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone || !address)
      return res.status(400).json({ error: "يرجى إدخال جميع الحقول" });

    const existsName = await Contractor.findOne({ name, _id: { $ne: req.params.id } });
    if (existsName) return res.status(409).json({ error: "اسم المتعهد موجود بالفعل" });

    const existsPhone = await Contractor.findOne({ phone, _id: { $ne: req.params.id } });
    if (existsPhone) return res.status(409).json({ error: "رقم الهاتف مستخدم مسبقاً" });

    const contractor = await Contractor.findByIdAndUpdate(
      req.params.id,
      { name, phone, address },
      { new: true }
    );
    if (!contractor) return res.status(404).json({ error: "لم يتم العثور على المتعهد" });
    res.json(contractor);
  } catch (err) {
    res.status(500).json({ error: "فشل في تعديل المتعهد" });
  }
});

// حذف متعهد
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Contractor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "لم يتم العثور على المتعهد" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في حذف المتعهد" });
  }
});

export default router;
