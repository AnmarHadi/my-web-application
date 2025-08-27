// src/pages/UsersPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Alert, MenuItem, Select, FormControl, InputLabel, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

type Role = "admin" | "editor" | "viewer";
type User = {
  id: string;
  name: string;
  username: string;
  phone?: string;
  role: Role;
  createdAt?: string;
};

const API = "/api/users";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // بحث
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return users;
    const s = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.username.toLowerCase().includes(s) ||
        (u.phone || "").includes(s)
    );
  }, [q, users]);

  // فورم الإضافة/التعديل
  const [openForm, setOpenForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [formError, setFormError] = useState("");

  // حذف
  const [askDelete, setAskDelete] = useState<{ open: boolean; id: string | null; name?: string }>({ open: false, id: null });

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API);
      setUsers(res.data || []);
      setMsg(null);
    } catch {
      setUsers([]);
      setMsg({ type: "error", text: "فشل في جلب المستخدمين" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setUsername("");
    setPhone("");
    setRole("viewer");
    setPassword("");
    setConfirmPwd("");
    setFormError("");
    setShowPwd(false);
    setShowConfirmPwd(false);
  };

  const openAdd = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (u: User) => {
    resetForm();
    setEditId(u.id);
    setName(u.name);
    setUsername(u.username);
    setPhone(u.phone || "");
    setRole(u.role);
    setOpenForm(true);
  };

  const validate = () => {
    if (!name.trim()) return "يرجى إدخال الاسم";
    if (!username.trim()) return "يرجى إدخال اسم المستخدم";
    if (!/^[A-Za-z0-9._-]{3,20}$/.test(username)) return "اسم المستخدم يجب أن يكون 3-20 (أحرف/أرقام/._-)";
    if (phone && !/^07\d{9}$/.test(phone)) return "رقم الهاتف يجب أن يبدأ بـ07 ويتكون من 11 رقمًا";
    if (!editId) {
      if (!password) return "يرجى إدخال كلمة المرور";
      if (password.length < 6) return "كلمة المرور يجب أن تكون 6 رموز فأكثر";
      if (password !== confirmPwd) return "تأكيد كلمة المرور غير مطابق";
    } else {
      if (password && password.length < 6) return "كلمة المرور يجب أن تكون 6 رموز فأكثر";
      if (password && password !== confirmPwd) return "تأكيد كلمة المرور غير مطابق";
    }
    return "";
  };

  const save = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    try {
      const payload: any = { name: name.trim(), username: username.trim(), phone: phone.trim(), role };
      if (password) payload.password = password;
      if (!editId) {
        await axios.post(API, payload);
        setMsg({ type: "success", text: "تمت إضافة المستخدم بنجاح" });
      } else {
        await axios.put(`${API}/${editId}`, payload);
        setMsg({ type: "success", text: "تم تحديث بيانات المستخدم" });
      }
      setOpenForm(false);
      await load();
    } catch (e: any) {
      const txt = e?.response?.data?.error || "حدث خطأ أثناء الحفظ";
      setFormError(txt);
    }
  };

  const doDelete = async () => {
    if (!askDelete.id) return;
    try {
      await axios.delete(`${API}/${askDelete.id}`);
      setMsg({ type: "success", text: "تم حذف المستخدم" });
      setAskDelete({ open: false, id: null });
      await load();
    } catch (e: any) {
      const txt = e?.response?.data?.error || "حدث خطأ أثناء الحذف";
      setMsg({ type: "error", text: txt });
    }
  };

  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 1100, mx: "auto", fontFamily: "Cairo, Arial, Tahoma, sans-serif" }}>
      <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 3 }}>
        المستخدمون
      </Typography>

      {/* شريط البحث والإجراءات */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mb: 2 }}>
        <TextField
          label="بحث (الاسم/اسم المستخدم/الهاتف)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
            inputProps: { style: { direction: "ltr", textAlign: "left" } }
          }}
        />
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={openAdd}>
          إضافة مستخدم
        </Button>
        <Button variant="outlined" onClick={load}>
          تحديث
        </Button>
      </Box>

      {msg && <Alert severity={msg.type} sx={{ mb: 2 }}>{msg.text}</Alert>}

      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">الدور</TableCell>
              <TableCell align="center">الهاتف</TableCell>
              <TableCell align="center">اسم المستخدم</TableCell>
              <TableCell align="center">الاسم</TableCell>
              <TableCell align="center">التاريخ</TableCell>
              <TableCell align="center">ت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center">...جاري التحميل</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">لا يوجد بيانات</TableCell></TableRow>
            ) : (
              filtered.map((u, i) => (
                <TableRow key={u.id}>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => openEdit(u)} title="تعديل"><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => setAskDelete({ open: true, id: u.id, name: u.name })} title="حذف"><DeleteIcon /></IconButton>
                  </TableCell>
                  <TableCell align="center">
                    {u.role === "admin" ? "مدير" : u.role === "editor" ? "محرر" : "مشاهد"}
                  </TableCell>
                  <TableCell align="center">{u.phone || "-"}</TableCell>
                  <TableCell align="center">{u.username}</TableCell>
                  <TableCell align="center">{u.name}</TableCell>
                  <TableCell align="center">{u.createdAt ? new Date(u.createdAt).toLocaleString("ar-EG") : "-"}</TableCell>
                  <TableCell align="center">{i + 1}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* نافذة إضافة/تعديل */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
          {editId ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField
            label="الاسم الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 80 }}
          />
          <TextField
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="مسموح أحرف/أرقام/._- بين 3 و 20"
            inputProps={{ maxLength: 20, style: { direction: "ltr", textAlign: "left" } }}
          />
          <TextField
            label="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
            helperText="يجب أن يبدأ بـ 07 ويتكون من 11 رقمًا"
            inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
          />
          <FormControl fullWidth>
            <InputLabel id="role-lbl">الدور</InputLabel>
            <Select
              labelId="role-lbl"
              label="الدور"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <MenuItem value="admin">مدير</MenuItem>
              <MenuItem value="editor">محرر</MenuItem>
              <MenuItem value="viewer">مشاهد</MenuItem>
            </Select>
          </FormControl>

          {/* كلمة المرور (مطلوبة عند الإضافة، اختيارية عند التعديل) */}
          <TextField
            label={editId ? "كلمة المرور (اتركها فارغة إن لم تُعدِّل)" : "كلمة المرور"}
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd(s => !s)} edge="end">
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <TextField
            label="تأكيد كلمة المرور"
            type={showConfirmPwd ? "text" : "password"}
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPwd(s => !s)} edge="end">
                    {showConfirmPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {formError && <Alert severity="error">{formError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button onClick={() => setOpenForm(false)} color="secondary" variant="outlined" sx={{ minWidth: 100 }}>
            إلغاء
          </Button>
          <Button onClick={save} color="primary" variant="contained" sx={{ minWidth: 120 }}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* تأكيد حذف */}
      <Dialog open={askDelete.open} onClose={() => setAskDelete({ open: false, id: null })}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل تريد حذف المستخدم {askDelete.name ? `"${askDelete.name}"` : ""} ؟</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 2 }}>
          <Button onClick={() => setAskDelete({ open: false, id: null })} variant="outlined" color="secondary">إلغاء</Button>
          <Button onClick={doDelete} variant="contained" color="error">حذف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
