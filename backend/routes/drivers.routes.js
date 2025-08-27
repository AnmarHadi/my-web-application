import express from "express";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Driver from "../models/Driver.model.js";
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

const dto = (driver, req) => ({
  id: driver._id,
  first: driver.first,
  father: driver.father,
  grandfather: driver.grandfather,
  fourth: driver.fourth,
  last: driver.last,
  fullName: driver.fullName,
  phone: driver.phone,
  licenseEnd: driver.licenseEnd,
  frontImage: driver.frontImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(driver.frontImage)}` : "",
  backImage: driver.backImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(driver.backImage)}` : "",
  // حقول مضافة (قد تكون غير موجودة إذا لم تحدّث الموديل بعد)
  motherFirst: driver.motherFirst || "",
  motherFather: driver.motherFather || "",
  motherGrandfather: driver.motherGrandfather || "",
  birthDate: driver.birthDate || "",
  nationalId: driver.nationalId || "",
  province: driver.province || "",
  areaAddress: driver.areaAddress || "",
  idFrontImage: driver.idFrontImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(driver.idFrontImage)}` : "",
  idBackImage: driver.idBackImage ? `${req.protocol}://${req.get("host")}/${getRelativePath(driver.idBackImage)}` : "",
});

// ===== GET /api/drivers (قائمة/بحث) =====
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    let filter = {};
    if (q) filter.fullName = { $regex: q, $options: "i" };
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.json(drivers.map((d) => dto(d, req)));
  } catch (err) {
    console.error("GET /api/drivers error:", err);
    res.status(500).json({ error: err.message || "فشل في جلب السائقين" });
  }
});

// ===== GET /api/drivers/:id (جلب سائق واحد) =====
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "معرف غير صالح" });

    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });

    res.json(dto(driver, req));
  } catch (err) {
    console.error("GET /api/drivers/:id error:", err);
    res.status(500).json({ error: err.message || "فشل في جلب السائق" });
  }
});

// ===== POST /api/drivers =====
router.post(
  "/",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "idFrontImage", maxCount: 1 },
    { name: "idBackImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        first, father, grandfather, fourth, last,
        phone, licenseEnd,
        motherFirst, motherFather, motherGrandfather,
        birthDate, nationalId, province, areaAddress,
      } = req.body;

      if (![first, father, grandfather, fourth, last, phone, licenseEnd].every(Boolean)) {
        return res.status(400).json({ error: "جميع الحقول الأساسية مطلوبة" });
      }

      const fullName = [first, father, grandfather, fourth, last]
        .join(" ").replace(/\s+/g, " ").trim();

      const exists = await Driver.findOne({ fullName });
      if (exists) return res.status(409).json({ error: "اسم السائق موجود بالفعل" });

      const frontImage = req.files.frontImage?.[0]?.path ? getRelativePath(req.files.frontImage[0].path) : "";
      const backImage  = req.files.backImage?.[0]?.path  ? getRelativePath(req.files.backImage[0].path)  : "";
      const idFrontImg = req.files.idFrontImage?.[0]?.path ? getRelativePath(req.files.idFrontImage[0].path) : "";
      const idBackImg  = req.files.idBackImage?.[0]?.path  ? getRelativePath(req.files.idBackImage[0].path)  : "";

      const driver = new Driver({
        first, father, grandfather, fourth, last,
        fullName,
        phone, licenseEnd,
        frontImage, backImage,
        // المضافة
        motherFirst, motherFather, motherGrandfather,
        birthDate, nationalId, province, areaAddress,
        idFrontImage: idFrontImg,
        idBackImage: idBackImg,
      });

      await driver.save();
      res.status(201).json(dto(driver, req));
    } catch (err) {
      console.error("POST /api/drivers error:", err);
      res.status(500).json({ error: err.message || "فشل في إضافة السائق" });
    }
  }
);

// ===== PUT /api/drivers/:id =====
router.put(
  "/:id",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "idFrontImage", maxCount: 1 },
    { name: "idBackImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id))
        return res.status(400).json({ error: "معرف غير صالح" });

      const {
        first, father, grandfather, fourth, last,
        phone, licenseEnd,
        motherFirst, motherFather, motherGrandfather,
        birthDate, nationalId, province, areaAddress,
      } = req.body;

      if (![first, father, grandfather, fourth, last, phone, licenseEnd].every(Boolean)) {
        return res.status(400).json({ error: "جميع الحقول الأساسية مطلوبة" });
      }

      const fullName = [first, father, grandfather, fourth, last]
        .join(" ").replace(/\s+/g, " ").trim();

      const duplicate = await Driver.findOne({ fullName, _id: { $ne: id } });
      if (duplicate) return res.status(409).json({ error: "اسم السائق مستخدم مسبقاً" });

      const driver = await Driver.findById(id);
      if (!driver) return res.status(404).json({ error: "لم يتم العثور على السائق" });

      // صور الرخصة
      let frontImage = driver.frontImage;
      if (req.files.frontImage?.[0]) {
        const newPath = getRelativePath(req.files.frontImage[0].path);
        if (frontImage && fs.existsSync(path.join(process.cwd(), frontImage))) fs.unlinkSync(path.join(process.cwd(), frontImage));
        frontImage = newPath;
      }
      let backImage = driver.backImage;
      if (req.files.backImage?.[0]) {
        const newPath = getRelativePath(req.files.backImage[0].path);
        if (backImage && fs.existsSync(path.join(process.cwd(), backImage))) fs.unlinkSync(path.join(process.cwd(), backImage));
        backImage = newPath;
      }

      // صور البطاقة الوطنية
      let idFrontImage = driver.idFrontImage;
      if (req.files.idFrontImage?.[0]) {
        const newPath = getRelativePath(req.files.idFrontImage[0].path);
        if (idFrontImage && fs.existsSync(path.join(process.cwd(), idFrontImage))) fs.unlinkSync(path.join(process.cwd(), idFrontImage));
        idFrontImage = newPath;
      }
      let idBackImage = driver.idBackImage;
      if (req.files.idBackImage?.[0]) {
        const newPath = getRelativePath(req.files.idBackImage[0].path);
        if (idBackImage && fs.existsSync(path.join(process.cwd(), idBackImage))) fs.unlinkSync(path.join(process.cwd(), idBackImage));
        idBackImage = newPath;
      }

      // تحديث الحقول
      driver.first = first;
      driver.father = father;
      driver.grandfather = grandfather;
      driver.fourth = fourth;
      driver.last = last;
      driver.phone = phone;
      driver.licenseEnd = licenseEnd;
      driver.frontImage = frontImage;
      driver.backImage = backImage;

      driver.motherFirst = motherFirst;
      driver.motherFather = motherFather;
      driver.motherGrandfather = motherGrandfather;
      driver.birthDate = birthDate;
      driver.nationalId = nationalId;
      driver.province = province;
      driver.areaAddress = areaAddress;
      driver.idFrontImage = idFrontImage;
      driver.idBackImage = idBackImage;

      await driver.save();
      res.json(dto(driver, req));
    } catch (err) {
      console.error("PUT /api/drivers/:id error:", err);
      res.status(500).json({ error: err.message || "فشل في تعديل السائق" });
    }
  }
);

// ===== DELETE /api/drivers/:id =====
router.delete("/:id", async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: "السائق غير موجود" });

    const maybeDel = (p) => {
      if (p && fs.existsSync(path.join(process.cwd(), p))) {
        fs.unlinkSync(path.join(process.cwd(), p));
      }
    };
    maybeDel(driver.frontImage);
    maybeDel(driver.backImage);
    maybeDel(driver.idFrontImage);
    maybeDel(driver.idBackImage);

    await Driver.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/drivers/:id error:", err);
    res.status(500).json({ error: err.message || "فشل في حذف السائق" });
  }
});

export default router;
