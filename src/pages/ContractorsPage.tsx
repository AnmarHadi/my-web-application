// src/pages/ContractorsPage.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:5000/api/contractors";

type Contractor = {
  _id: string;
  name: string;
  phone: string;
  address: string;
};

type FormState = {
  name: string;
  phone: string;
  address: string;
};

export default function ContractorsPage() {
  // حالة الصفحة
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);

  // نافذة الإضافة/التعديل
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // جلب المتعهدين عند أول تحميل
  useEffect(() => {
    fetchContractors();
  }, []);

  // جلب المتعهدين من الباك اند
  const fetchContractors = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Contractor[]>(API_URL);
      setContractors(res.data || []);
    } catch {
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  // فتح نافذة إضافة أو تعديل
  const handleOpen = (contractor: Contractor | null = null, idx: number | null = null) => {
    setError("");
    setSuccess("");
    if (contractor) {
      setForm({
        name: contractor.name,
        phone: contractor.phone,
        address: contractor.address,
      });
      setEditIndex(idx);
    } else {
      setForm({ name: "", phone: "", address: "" });
      setEditIndex(null);
    }
    setOpen(true);
  };

  // غلق النافذة
  const handleClose = () => {
    setOpen(false);
    setError("");
    setSuccess("");
    setForm({ name: "", phone: "", address: "" });
    setEditIndex(null);
  };

  // تغيير بيانات النموذج
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  // إضافة أو تعديل متعهد
  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!form.name.trim()) {
      setError("يرجى إدخال اسم المتعهد");
      return;
    }
    if (!/^[0-9]{11}$/.test(form.phone)) {
      setError("رقم الهاتف يجب أن يكون 11 رقماً");
      return;
    }
    if (!form.address.trim()) {
      setError("يرجى إدخال العنوان");
      return;
    }

    try {
      if (editIndex !== null) {
        // تعديل
        const id = contractors[editIndex]?._id;
        if (!id) {
          setError("معرّف المتعهد غير موجود");
          return;
        }
        await axios.put(`${API_URL}/${id}`, form);
        setSuccess("تم تعديل بيانات المتعهد بنجاح!");
      } else {
        // إضافة
        await axios.post(API_URL, form);
        setSuccess("تمت إضافة المتعهد بنجاح!");
      }
      handleClose();
      fetchContractors();
    } catch (err) {
      const axErr = err as AxiosError<{ error?: string }>;
      setError(axErr.response?.data?.error || "حدث خطأ أثناء الحفظ");
    }
  };

  // حذف متعهد
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل تريد حذف المتعهد "${name}"؟`)) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchContractors();
    } catch {
      setError("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 700,
        mx: "auto",
        mt: 5,
        p: 2,
        bgcolor: "#fafbfd",
        borderRadius: 2,
        boxShadow: 1,
        direction: "rtl",
        minHeight: "80vh",
      }}
    >
      <Typography variant="h5" align="center" fontWeight="bold" mb={2}>
        إدارة المتعهدين
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        sx={{ width: "100%", mb: 2, fontWeight: 700, fontSize: 18, height: 42 }}
        onClick={() => handleOpen()}
        disabled={loading}
      >
        إضافة متعهد جديد
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* الجدول */}
      <Paper sx={{ width: "100%", overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">العنوان</TableCell>
              <TableCell align="center">رقم الهاتف</TableCell>
              <TableCell align="center">اسم المتعهد</TableCell>
              <TableCell align="center">ت</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && contractors.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  لا توجد بيانات متعهدين بعد.
                </TableCell>
              </TableRow>
            )}
            {contractors.map((row, idx) => (
              <TableRow key={row._id}>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpen(row, idx)}
                    title="تعديل"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(row._id, row.name)}
                    title="حذف"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">{row.address}</TableCell>
                <TableCell align="center">{row.phone}</TableCell>
                <TableCell align="center">{row.name}</TableCell>
                <TableCell align="center">{idx + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* نافذة الإضافة/التعديل */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle align="center" fontWeight={700}>
          {editIndex !== null ? "تعديل بيانات المتعهد" : "إضافة متعهد جديد"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="اسم المتعهد"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 60, dir: "rtl" }}
          />
          <TextField
            label="رقم الهاتف"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
            inputProps={{
              maxLength: 11,
              inputMode: "numeric",
              pattern: "[0-9]*",
              dir: "ltr",
            }}
            helperText="يجب أن يكون 11 رقمًا"
            error={!!form.phone && !/^[0-9]{11}$/.test(form.phone)}
          />
          <TextField
            label="العنوان"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 100, dir: "rtl" }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, justifyContent: "space-between" }}>
          <Button
            onClick={handleClose}
            color="secondary"
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
