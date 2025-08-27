// backend/routes/telegramsAccess.routes.js
import express from "express";
import fs from "fs";
import path from "path";
import ADODB from "node-adodb";

const router = express.Router();

// استخدم cscript من System32 (أفضل من SysWOW64)
try {
  ADODB.set("cscript", "C:\\Windows\\System32\\cscript.exe");
  console.log("[ADODB] using cscript:", "C:\\Windows\\System32\\cscript.exe");
} catch { /* تجاهل لو غير مدعوم */ }

// ——— إعداد السلوك (حل وسط): احتفاظ أو تنزيل/حذف ———
const PERSIST_ACCESS = String(process.env.PERSIST_ACCESS || "").toLowerCase() === "true";

//— أدوات مساعدة —//
const PROVINCE_CODE = new Map([
  ["بغداد", 1],
  ["نينوى", 2],
  ["البصرة", 3],
  ["الأنبار", 4],
  ["ذي قار", 5],
  ["السليمانية", 6],
  ["القادسية", 7], // (الديوانية)
  ["صلاح الدين", 8],
  ["النجف", 9],
  ["كركوك", 10],
  ["ديالى", 11],
  ["المثنى", 12],
  ["ميسان", 13],
  ["واسط", 14],
  ["أربيل", 15],
  ["بابل", 16],
  ["دهوك", 17],
]);

function provinceToCode(name) {
  if (!name) return null;
  const code = PROVINCE_CODE.get(String(name).trim());
  return Number.isInteger(code) ? code : null;
}

function sanitizeText(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s.replace(/'/g, "''") : null;
}

// تحويل التاريخ إلى literal مفهوم داخل Access: #YYYY-MM-DD#
function toAccessDateLiteral(val) {
  if (!val) return "NULL";
  const s = String(val).trim();

  // 1) YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `#${y}-${mo}-${d}#`;
  }

  // 2) DD/MM/YYYY
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `#${yyyy}-${mm}-${dd}#`;
  }

  // 3) أي صيغة صالحة لـ JS
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `#${yyyy}-${mm}-${dd}#`;
  }

  return "NULL";
}

// جرّب أكثر من احتمال لمكان القالب
function resolveTemplateCandidates() {
  const cwd = process.cwd(); // عادةً = backend
  const here = path.dirname(new URL(import.meta.url).pathname);
  const hereFixed =
    here.startsWith("/") && process.platform === "win32" ? here.slice(1) : here;

  return [
    path.resolve(cwd, "templates", "telegrams_template.accdb"),
    path.resolve(cwd, "telegrams_template.accdb"),
    path.resolve(hereFixed, "..", "templates", "telegrams_template.accdb"),
  ];
}

router.post("/export", async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];

    if (!rows.length) {
      return res.status(400).json({ error: "لا توجد بيانات لإدراجها." });
    }

    const candidates = resolveTemplateCandidates();
    const templatePath = candidates.find((p) => fs.existsSync(p));
    if (!templatePath) {
      return res.status(500).json({
        error:
          "ملف القالب غير موجود. ضع ملف ACCDB اسمه telegrams_template.accdb داخل backend/templates وفيه جدول informatio.",
        lookedIn: candidates,
      });
    }

    // مسار الإخراج
    const exportsDir = path.resolve(process.cwd(), "exports");
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.join(exportsDir, `telegrams_${ts}.accdb`);

    // انسخ القالب
    fs.copyFileSync(templatePath, outPath);
    console.log("[telegrams-access] copied template to:", outPath);

    // اتصال ADO بـ Access
    const connStr = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${outPath};Persist Security Info=False;`;
    const db = ADODB.open(connStr);

    // إدراج صفوف
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};

      // خرائط الحقول حسب المطلوب + العنوان dr_ner
      const rec = {
        dr_na: sanitizeText(r.first) ?? "",
        dr_fa: sanitizeText(r.father) ?? "",
        dr_gr: sanitizeText(r.grandfather) ?? "",
        dr_f_g: sanitizeText(r.fourth) ?? "",
        dr_alk: sanitizeText(r.last) ?? "",
        date_ph: r.birthDate, // سيُحَوَّل بـ toAccessDateLiteral
        dr_n_h: sanitizeText(r.nationalId) ?? "", // نص
        dr_m_m: sanitizeText(
          r.motherTriple ||
            [r.motherFirst, r.motherFather, r.motherGrandfather]
              .filter(Boolean)
              .join(" ")
        ) ?? "",
        vehicle_no: sanitizeText(r.vehicleNumber) ?? "",
        vh_cov: provinceToCode(r.vehicleProvince), // رقم أو null
        vehicle_type: sanitizeText(r.wheelType) ?? "",
        vehicle_owner: sanitizeText(r.ownerName) ?? "",
        dr_gove: provinceToCode(r.driverProvince), // رقم أو null
        dr_ner: sanitizeText(r.address) ?? "", // العنوان (نص)
      };

      // ترتيب الأعمدة مطابق لجدول informatio
      const colsList = [
        "dr_na", "dr_fa", "dr_gr", "dr_f_g", "dr_alk",
        "date_ph",
        "dr_n_h", "dr_m_m",
        "vehicle_no", "vh_cov", "vehicle_type", "vehicle_owner",
        "dr_gove",
        "dr_ner"
      ];

      const cols = colsList.map((k) => `[${k}]`).join(", ");

      const vals = [
        // نصوص
        rec.dr_na !== null ? `'${rec.dr_na}'` : "NULL",
        rec.dr_fa !== null ? `'${rec.dr_fa}'` : "NULL",
        rec.dr_gr !== null ? `'${rec.dr_gr}'` : "NULL",
        rec.dr_f_g !== null ? `'${rec.dr_f_g}'` : "NULL",
        rec.dr_alk !== null ? `'${rec.dr_alk}'` : "NULL",

        // تاريخ
        toAccessDateLiteral(rec.date_ph),

        // نصوص
        rec.dr_n_h !== null ? `'${rec.dr_n_h}'` : "NULL",
        rec.dr_m_m !== null ? `'${rec.dr_m_m}'` : "NULL",

        // مركبة
        rec.vehicle_no !== null ? `'${rec.vehicle_no}'` : "NULL",
        // أرقام
        rec.vh_cov !== null && rec.vh_cov !== undefined ? `${rec.vh_cov}` : "NULL",

        // نصوص
        rec.vehicle_type !== null ? `'${rec.vehicle_type}'` : "NULL",
        rec.vehicle_owner !== null ? `'${rec.vehicle_owner}'` : "NULL",

        // أرقام
        rec.dr_gove !== null && rec.dr_gove !== undefined ? `${rec.dr_gove}` : "NULL",

        // العنوان نص
        rec.dr_ner !== null ? `'${rec.dr_ner}'` : "NULL",
      ].join(", ");

      const sql = `INSERT INTO informatio (${cols}) VALUES (${vals})`;

      try {
        await db.execute(sql);
      } catch (e) {
        console.error(`[telegrams-access] insert failed at row ${i + 1}:`, e?.message || e);
        console.error("[telegrams-access] SQL was:", sql);
        throw e;
      }
    }

    console.log("[telegrams-access] inserted rows:", rows.length);

    // ——— سلوك الحل الوسط ———
    if (PERSIST_ACCESS) {
      // احتفظ بالملف وأعد JSON يحوي رابط التحميل
      const downloadUrl = `/exports/${path.basename(outPath)}`;
      return res.json({ ok: true, path: outPath, downloadUrl });
    }

    // نزّل الملف مباشرة ثم احذفه بعد الإرسال
    res.download(outPath, path.basename(outPath), (err) => {
      if (err) {
        console.error("download error:", err);
        // حاول حذف الملف حتى عند الفشل
        fs.unlink(outPath, () => {});
        if (!res.headersSent) {
          res.status(500).json({ error: "تعذر إرسال الملف للتحميل." });
        }
      } else {
        // حذف بعد الإرسال
        fs.unlink(outPath, () => {});
      }
    });
  } catch (err) {
    console.error("export access error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        error:
          err?.message ||
          "تعذر إنشاء ملف Access. تأكد من وجود القالب وصحة تثبيت Microsoft ACE OLEDB.",
      });
    }
  }
});

export default router;
