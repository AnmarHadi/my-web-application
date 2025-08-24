import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle.model.js";
import Contractor from "../models/Contractor.model.js";
import upload from "../upload.js";

const router = express.Router();

const getRelativePath = (filePath) => {
  if (!filePath) return "";
  let idx = filePath.lastIndexOf("uploads\\");
  if (idx >= 0) return filePath.substring(idx).replace(/\\/g, "/");
  idx = filePath.lastIndexOf("uploads/");
  if (idx >= 0) return filePath.substring(idx);
  return filePath;
};

const dto = (v, req) => ({
  id: v._id,
  number: v.number,
  province: v.province,
  contractor: v.contractor?._id || v.contractor || "",
  contractorName: v.contractor?.name || "",
  annualEnd: v.annualEnd,
  annualImage: v.annualImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(v.annualImage)}` : "",
  checkupEnd: v.checkupEnd,
  checkupImage: v.checkupImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(v.checkupImage)}` : "",
  // الحقول المضافة
  wheelType: v.wheelType || "",
  ownerName: v.ownerName || "",
  address: v.address || "",
});

// ===== GET /api/vehicles (قائمة/بحث) =====
router.get("/", async (req, res) => {
  try {
    const { number, province, contractor } = req.query;
    let filter = {};
    if (number) filter.number = { $regex: number, $options: "i" };
    if (province) filter.province = province;
    if (contractor) filter.contractor = contractor;

    const vehicles = await Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .populate("contractor", "name");

    res.json(vehicles.map((v) => dto(v, req)));
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب المركبات" });
  }
});

// ===== GET /api/vehicles/:id =====
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "معرف غير صالح" });

    const vehicle = await Vehicle.findById(id).populate("contractor", "name");
    if (!vehicle) return res.status(404).json({ error: "المركبة غير موجودة" });

    res.json(dto(vehicle, req));
  } catch (err) {
    console.error("GET /api/vehicles/:id error:", err);
    res.status(500).json({ error: "فشل في جلب المركبة" });
  }
});

// ===== POST /api/vehicles =====
router.post(
  "/",
  upload.fields([
    { name: "annualImage", maxCount: 1 },
    { name: "checkupImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { number, province, contractor, annualEnd, checkupEnd, wheelType, ownerName, address } = req.body;
      if (!number || !contractor) {
        return res.status(400).json({ error: "رقم المركبة واسم المتعهد مطلوبان" });
      }
      const exists = await Vehicle.findOne({ number });
      if (exists) {
        return res.status(409).json({ error: "رقم المركبة موجود بالفعل في قاعدة البيانات" });
      }

      const annualImage = req.files.annualImage?.[0]?.path ? getRelativePath(req.files.annualImage[0].path) : "";
      const checkupImage = req.files.checkupImage?.[0]?.path ? getRelativePath(req.files.checkupImage[0].path) : "";

      const vehicle = new Vehicle({
        number, province, contractor, annualEnd, annualImage, checkupEnd, checkupImage,
        wheelType, ownerName, address,
      });
      await vehicle.save();

      const contractorDoc = await Contractor.findById(contractor);
      res.status(201).json({
        ...dto(vehicle, req),
        contractorName: contractorDoc?.name || "",
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: "رقم المركبة موجود بالفعل" });
      }
      res.status(500).json({ error: "فشل في إضافة المركبة" });
    }
  }
);

// ===== PUT /api/vehicles/:id =====
router.put(
  "/:id",
  upload.fields([
    { name: "annualImage", maxCount: 1 },
    { name: "checkupImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { number, province, contractor, annualEnd, checkupEnd, wheelType, ownerName, address } = req.body;
      if (!number || !contractor)
        return res.status(400).json({ error: "يرجى إدخال جميع الحقول المطلوبة" });

      const exists = await Vehicle.findOne({
        number,
        _id: { $ne: req.params.id },
      });
      if (exists)
        return res.status(409).json({ error: "رقم المركبة مستخدم مسبقاً" });

      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) return res.status(404).json({ error: "لم يتم العثور على المركبة" });

      let annualImage = vehicle.annualImage;
      if (req.files.annualImage?.[0]) {
        const newPath = getRelativePath(req.files.annualImage[0].path);
        if (annualImage && fs.existsSync(path.join(process.cwd(), annualImage))) fs.unlinkSync(path.join(process.cwd(), annualImage));
        annualImage = newPath;
      }

      let checkupImage = vehicle.checkupImage;
      if (req.files.checkupImage?.[0]) {
        const newPath = getRelativePath(req.files.checkupImage[0].path);
        if (checkupImage && fs.existsSync(path.join(process.cwd(), checkupImage))) fs.unlinkSync(path.join(process.cwd(), checkupImage));
        checkupImage = newPath;
      }

      vehicle.number = number;
      vehicle.province = province;
      vehicle.contractor = contractor;
      vehicle.annualEnd = annualEnd;
      vehicle.annualImage = annualImage;
      vehicle.checkupEnd = checkupEnd;
      vehicle.checkupImage = checkupImage;
      vehicle.wheelType = wheelType;
      vehicle.ownerName = ownerName;
      vehicle.address = address;

      await vehicle.save();
      const contractorDoc = await Contractor.findById(contractor);

      res.json({
        ...dto(vehicle, req),
        contractorName: contractorDoc?.name || "",
      });
    } catch (err) {
      res.status(500).json({ error: "فشل في تعديل المركبة" });
    }
  }
);

// ===== DELETE /api/vehicles/:id =====
router.delete("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: "المركبة غير موجودة" });
    }

    const maybeDel = (p) => {
      if (p && fs.existsSync(path.join(process.cwd(), p))) {
        fs.unlinkSync(path.join(process.cwd(), p));
      }
    };
    maybeDel(vehicle.annualImage);
    maybeDel(vehicle.checkupImage);

    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "فشل في حذف المركبة" });
  }
});

export default router;
