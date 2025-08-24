// backend/routes/unloading.routes.js
import express from "express";
import Document from "../models/Document.model.js";

const router = express.Router();

/** util: نرجع true للمستندات غير المفرّغة (أو التي لا تحتوي الحقل نهائياً) */
const notUnloaded = { $or: [{ isUnloaded: false }, { isUnloaded: { $exists: false } }] };

/** تحويل نص (من الـQR) إلى {letter, number} */
function parseDocCode(input) {
  if (!input) return { letter: "", number: "" };
  const s = String(input).trim();
  // لقبول C541252 أو C-541252
  let m = s.match(/^([A-Za-z]+)[-\s]?(\d+)$/);
  if (m) return { letter: m[1].toUpperCase(), number: m[2] };
  return { letter: "", number: "" };
}

/** GET /api/unloading/qr?code=...  */
router.get("/qr", async (req, res) => {
  try {
    const raw = String(req.query.code || "").trim();
    if (!raw) return res.status(400).json({ error: "QRCode فارغ" });

    // حاول قراءة JSON من الـQR (كما نطبعه في الوصل)
    let docStr = "";
    try {
      const obj = JSON.parse(raw);
      if (obj && obj.doc) docStr = String(obj.doc);
    } catch {
      // ليس JSON — استخدمه كما هو
      docStr = raw;
    }

    const { letter, number } = parseDocCode(docStr);
    if (!letter || !number) {
      return res.status(404).json({ error: "لا يوجد مستند مطابق" });
    }

    const doc = await Document.findOne({
      operationType: "تحميل",
      letter: new RegExp(`^${letter}$`, "i"),
      number: new RegExp(`^${number}$`, "i"),
      ...notUnloaded,
    })
      .populate("driverId", "fullName name phone")
      .populate("vehicleId", "number province wheelType ownerName")
      .populate("productId", "name unit")
      .populate("locationId", "name")
      .lean();

    if (!doc) return res.status(404).json({ error: "لا يوجد مستند مطابق" });

    // رجّع الشكل الذي تتوقعه الواجهة
    res.json({
      id: String(doc._id),
      docNo: `${doc.letter}${doc.number}`,       // بدون شرطة
      createdAt: doc.createdAt,
      operationType: doc.operationType,
      paymentType: doc.paymentType,
      unit: doc.unit,
      loadedQty: doc.quantity,
      total: doc.total ?? 0,
      advance: doc.advance ?? 0,
      province: doc.province || "",
      locationId: doc.locationId?._id || "",
      driver: doc.driverId
        ? { name: doc.driverId.name || doc.driverId.fullName || "", phone: doc.driverId.phone }
        : null,
      vehicle: doc.vehicleId
        ? {
            number: doc.vehicleId.number,
            province: doc.vehicleId.province,
            wheelType: doc.vehicleId.wheelType,
            ownerName: doc.vehicleId.ownerName,
          }
        : null,
      product: doc.productId ? { name: doc.productId.name, unit: doc.productId.unit } : null,
      location: doc.locationId ? { name: doc.locationId.name } : null,
    });
  } catch (e) {
    console.error("qr lookup error:", e);
    res.status(500).json({ error: "خطأ في البحث عن المستند" });
  }
});

/** GET /api/unloading/pending  (مع فلاتر اختيارية) */
router.get("/pending", async (req, res) => {
  try {
    const { dateFrom, dateTo, docNumber } = req.query;
    const where = { operationType: "تحميل", ...notUnloaded };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.$gte = new Date(String(dateFrom));
      if (dateTo) where.createdAt.$lte = new Date(String(dateTo));
    }

    if (docNumber && String(docNumber).trim()) {
      const term = String(docNumber).trim();
      // يطابق الحرف أو الرقم أو دمجهما (بدون شرطة)
      where.$or = [
        { letter: new RegExp(term, "i") },
        { number: new RegExp(term, "i") },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$letter", "$number"] },
              regex: term,
              options: "i",
            },
          },
        },
      ];
    }

    const docs = await Document.find(where)
      .sort({ createdAt: -1 })
      .populate("driverId", "fullName name phone")
      .populate("vehicleId", "number province wheelType ownerName")
      .populate("productId", "name unit")
      .populate("locationId", "name")
      .lean();

    const rows = docs.map((doc) => ({
      id: String(doc._id),
      docNo: `${doc.letter}${doc.number}`,
      createdAt: doc.createdAt,
      operationType: doc.operationType,
      paymentType: doc.paymentType,
      unit: doc.unit,
      loadedQty: doc.quantity,
      total: doc.total ?? 0,
      advance: doc.advance ?? 0,
      province: doc.province || "",
      locationId: doc.locationId?._id || "",
      driver: doc.driverId
        ? { name: doc.driverId.name || doc.driverId.fullName || "", phone: doc.driverId.phone }
        : null,
      vehicle: doc.vehicleId
        ? {
            number: doc.vehicleId.number,
            province: doc.vehicleId.province,
            wheelType: doc.vehicleId.wheelType,
            ownerName: doc.vehicleId.ownerName,
          }
        : null,
      product: doc.productId ? { name: doc.productId.name, unit: doc.productId.unit } : null,
      location: doc.locationId ? { name: doc.locationId.name } : null,
    }));

    res.json(rows);
  } catch (e) {
    console.error("pending error:", e);
    res.status(500).json({ error: "فشل في جلب المستندات" });
  }
});

/** PUT /api/unloading/:id  (تسجيل التفريغ) */
router.put("/:id", async (req, res) => {
  try {
    const { unloadingQty, unloadingDate, finalTotal } = req.body || {};
    if (!unloadingQty || Number(unloadingQty) <= 0) {
      return res.status(400).json({ error: "أدخل كمية تفريغ صالحة" });
    }

    const update = {
      isUnloaded: true,
      unloadQuantity: Number(unloadingQty),
      unloadDate: unloadingDate ? new Date(unloadingDate) : new Date(),
    };
    if (finalTotal !== undefined) update.finalTotal = Number(finalTotal);

    const doc = await Document.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ error: "المستند غير موجود" });
    res.json({ ok: true });
  } catch (e) {
    console.error("register unloading error:", e);
    res.status(500).json({ error: "فشل حفظ التفريغ" });
  }
});

export default router;
