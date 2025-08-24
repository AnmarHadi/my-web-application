// backend/routes/users.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

const router = express.Router();

const isValidUsername = (u) => /^[A-Za-z0-9._-]{3,20}$/.test(u || "");
const isValidPhone = (p) => !p || /^07\d{9}$/.test(p);

// GET: list users
router.get("/", async (req, res) => {
  try {
    const list = await User.find().sort({ createdAt: -1 });
    res.json(list.map((u) => u.toClient()));
  } catch {
    res.status(500).json({ error: "فشل في جلب المستخدمين" });
  }
});

// POST: create user
router.post("/", async (req, res) => {
  try {
    const { name, username, phone = "", role = "viewer", password } = req.body || {};
    if (!name || !username || !password) {
      return res.status(400).json({ error: "الاسم واسم المستخدم وكلمة المرور مطلوبة" });
    }
    if (!isValidUsername(username)) return res.status(400).json({ error: "اسم المستخدم غير صالح" });
    if (!isValidPhone(phone)) return res.status(400).json({ error: "رقم الهاتف غير صالح" });
    if (!["admin", "editor", "viewer"].includes(role)) return res.status(400).json({ error: "الدور غير صالح" });

    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: "اسم المستخدم مستخدم مسبقًا" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      phone: phone.trim(),
      role,
      passwordHash,
    });
    res.status(201).json(user.toClient());
  } catch (e) {
    res.status(500).json({ error: "فشل في إضافة المستخدم" });
  }
});

// PUT: update user
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, phone = "", role, password } = req.body || {};

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

    if (username && !isValidUsername(username)) return res.status(400).json({ error: "اسم المستخدم غير صالح" });
    if (!isValidPhone(phone)) return res.status(400).json({ error: "رقم الهاتف غير صالح" });
    if (role && !["admin", "editor", "viewer"].includes(role)) return res.status(400).json({ error: "الدور غير صالح" });

    if (username && username.toLowerCase() !== user.username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) return res.status(409).json({ error: "اسم المستخدم مستخدم مسبقًا" });
      user.username = username.toLowerCase().trim();
    }

    if (typeof name === "string") user.name = name.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (role) user.role = role;

    if (password) {
      if (String(password).length < 6) return res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 رموز فأكثر" });
      user.passwordHash = await bcrypt.hash(String(password), 10);
    }

    await user.save();
    res.json(user.toClient());
  } catch {
    res.status(500).json({ error: "فشل في تعديل المستخدم" });
  }
});

// DELETE: delete user
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });

    // منع حذف آخر مدير (اختياري)
    const adminsCount = await User.countDocuments({ role: "admin" });
    if (user.role === "admin" && adminsCount <= 1) {
      return res.status(400).json({ error: "لا يمكن حذف آخر مدير في النظام" });
    }

    await User.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "فشل في حذف المستخدم" });
  }
});

export default router;
