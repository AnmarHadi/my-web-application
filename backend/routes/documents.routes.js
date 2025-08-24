// backend/routes/documents.routes.js
import express from "express";
import Document from "../models/Document.model.js";
import TransferPrice from "../models/TransferPrice.model.js";
import Location from "../models/Location.model.js";
const router = express.Router();

// GET جميع أنواع المستندات
router.get("/types", async (req, res) => {
  // عدل حسب مكان تخزين الأنواع لديك
  const types = await DocumentType.find().select("name");
  res.json(types);
});

// GET جلب كل السائقين
router.get("/drivers", async (req, res) => {
  const drivers = await Driver.find().select("fullName");
  res.json(drivers);
});

// GET جلب كل المركبات مع المحافظة
router.get("/vehicles", async (req, res) => {
  const vehicles = await Vehicle.find().select("number province");
  res.json(vehicles);
});

// GET جلب الوجهات حسب المحافظة ونوع العملية
router.get("/locations", async (req, res) => {
  const { province, operationType } = req.query;
  let filter = {};
  if (province) filter.province = province;
  if (operationType) filter.operationType = operationType;
  const locations = await Location.find(filter).select("name province operationType");
  res.json(locations);
});

// GET جلب كل المنتجات
router.get("/products", async (req, res) => {
  const products = await Product.find().select("name");
  res.json(products);
});

// POST لحساب السعر بدون إدخال (يستخدم عند الضغط على زر "إدخال" في النافذة المنبثقة)
router.post("/calculate", async (req, res) => {
  const { operationType, province, locationId, unit, quantity, addAmount = 0, deductAmount = 0 } = req.body;
  const priceRow = await TransferPrice.findOne({ operationType, province, locationId });
  if (!priceRow) return res.status(404).json({ error: "لا يوجد سعر مطابق" });

  let total = 0;
  if (priceRow.paymentType === "مقطوعة") {
    total = priceRow.price;
  } else if (priceRow.paymentType === "باللتر" || (unit === "لتر")) {
    total = priceRow.price * quantity;
  } else if (priceRow.paymentType === "بالطن" || (unit === "كغم")) {
    total = priceRow.price * quantity;
  }
  total = total + Number(addAmount) - Number(deductAmount);
  res.json({
    total,
    advance: priceRow.advance,
    paymentType: priceRow.paymentType,
  });
});

// POST لإدخال مستند جديد
router.post("/", async (req, res) => {
  try {
    const doc = await Document.create(req.body);
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: "فشل في إدخال المستند", details: err.message });
  }
});

export default router;
