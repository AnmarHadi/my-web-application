// backend/routes/najaf-transfer-prices.routes.js
import express from "express";
import NajafTransferPrice from "../models/NajafTransferPrice.model.js";
const router = express.Router();

// GET all najaf transfer prices
router.get("/", async (req, res) => {
  try {
    const prices = await NajafTransferPrice.find();
    const result = prices.map(price => ({
      id: price._id,
      minLoad: price.minLoad,
      maxLoad: price.maxLoad,
      price: price.price,
      advance: price.advance,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب أسعار النجف" });
  }
});

// POST add new price
router.post("/", async (req, res) => {
  try {
    const { minLoad, maxLoad, price, advance } = req.body;
    if (!minLoad || !maxLoad || !price) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    const row = await NajafTransferPrice.create({ minLoad, maxLoad, price, advance });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: "فشل في الإضافة" });
  }
});

// يمكنك إضافة DELETE و PUT إذا أردت لاحقًا

export default router;
