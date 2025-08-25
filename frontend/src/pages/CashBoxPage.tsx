// src/pages/CashBoxPage.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { arSA } from "date-fns/locale";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import * as XLSX from "xlsx";

type Transaction = {
  id: string;
  amount: number;
  details: string;
  type: string;
  createdAt: string;
  documentId?: string | null;
};

export default function CashBoxPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState<"add" | "withdraw">("add");
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [actionError, setActionError] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch("/api/cashbox");
      if (!res.ok) throw new Error("فشل في جلب البيانات");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setActionError("يرجى تحديد تاريخ البدء والانتهاء");
      return;
    }
    setLoading(true);
    setActionError("");
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const params = new URLSearchParams();
      params.append("from", start.toISOString());
      params.append("to", end.toISOString());
      const res = await fetch(`/api/cashbox/search?${params.toString()}`);
      if (!res.ok) throw new Error("فشل في جلب البيانات");
      const data = await res.json();
      setFiltered(data);
      setShowTable(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "حدث خطأ أثناء البحث");
      setShowTable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setFiltered(transactions);
    setShowTable(true);
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      setActionError("لا توجد بيانات للتصدير");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((t, i) => ({
        التسلسل: i + 1,
        المبلغ: t.amount,
        الوصف: t.details,
        النوع: t.type === "add" ? "إضافة" : "سحب",
        "تاريخ الإضافة": new Date(t.createdAt).toLocaleString("ar-EG"),
        "مرتبطة بمستند": t.documentId ? "نعم" : "لا",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "القاصة");
    XLSX.writeFile(wb, "cashbox.xlsx");
  };

  const getBalance = () =>
    transactions.reduce(
      (sum, t) => sum + (t.type === "add" ? t.amount : -t.amount),
      0
    );

  const openForm = (tr?: Transaction) => {
    if (tr) {
      if (tr.documentId) {
        setActionError("لا يمكن تعديل حركة مرتبطة بمستند");
        setTimeout(() => setActionError(""), 3000);
        return;
      }
      setEditId(tr.id);
      setAmount(tr.amount.toString());
      setDetails(tr.details);
      setType(tr.type === "add" ? "add" : "withdraw");
    } else {
      setEditId(null);
      setAmount("");
      setDetails("");
      setType("add");
    }
    setError("");
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!amount.trim() || isNaN(+amount) || !details.trim()) {
      setError("يرجى إدخال كل الحقول بشكل صحيح");
      return;
    }
    let res: Response;
    const data = { amount: +amount, details, type };
    try {
      if (editId) {
        res = await fetch(`/api/cashbox/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/cashbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ أثناء الحفظ");
      }

      setShowDialog(false);
      setAmount("");
      setDetails("");
      setEditId(null);
      await loadTransactions();
      if (showTable) {
        if (startDate && endDate) {
          await handleSearch();
        } else {
          setFiltered(transactions);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/cashbox/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ أثناء الحذف");
      }
      setDeleteId(null);
      setConfirmDelete(false);
      await loadTransactions();
      if (showTable) {
        if (startDate && endDate) {
          await handleSearch();
        } else {
          setFiltered(transactions);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير معروف");
    }
  };

  const requestDelete = (tr: Transaction) => {
    if (tr.documentId) {
      setActionError("لا يمكن حذف حركة مرتبطة بمستند");
      setTimeout(() => setActionError(""), 3000);
      return;
    }
    setDeleteId(tr.id);
    setConfirmDelete(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <Box sx={{ p: 3, direction: "rtl", maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} align="center" mb={3}>
          القاصة
        </Typography>

        <Card elevation={3} sx={{ mb: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 1 }}>
            <AccountBalanceWalletIcon
              color="primary"
              sx={{ fontSize: 40, ml: 2, verticalAlign: "middle" }}
            />
            <Typography
              variant="h5"
              fontWeight="bold"
              component="span"
              sx={{ verticalAlign: "middle" }}
            >
              رصيد القاصة الحالي:
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              component="span"
              sx={{
                color: getBalance() >= 0 ? "success.main" : "error.main",
                mr: 2,
                verticalAlign: "middle",
              }}
            >
              {getBalance().toLocaleString("ar-EG")} دينار
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            disabled={loading || !showTable || filtered.length === 0}
          >
            حفظ Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openForm()}
            disabled={loading}
          >
            إضافة
          </Button>
        </Box>

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        {/* قسم البحث */}
        <Card elevation={3} sx={{ p: 3, mb: 4 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              dir="rtl"
            >
              {/* من تاريخ */}
              <TextField
                type="date"
                label="من تاريخ"
                value={startDate ? startDate.toISOString().substring(0, 10) : ""}
                onChange={(e) =>
                  setStartDate(e.target.value ? new Date(e.target.value) : null)
                }
                InputLabelProps={{ shrink: true }}
                size="medium"
                sx={{ width: 200 }}
                InputProps={{
                  sx: { height: 40 },
                  inputProps: {
                    style: { height: "40px", padding: "0 14px", textAlign: "right" },
                  },
                }}
              />

              {/* إلى تاريخ */}
              <TextField
                type="date"
                label="إلى تاريخ"
                value={endDate ? endDate.toISOString().substring(0, 10) : ""}
                onChange={(e) =>
                  setEndDate(e.target.value ? new Date(e.target.value) : null)
                }
                InputLabelProps={{ shrink: true }}
                size="medium"
                sx={{ width: 200 }}
                InputProps={{
                  sx: { height: 40 },
                  inputProps: {
                    style: { height: "40px", padding: "0 14px", textAlign: "right" },
                  },
                }}
              />

              {/* زر البحث */}
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{ height: 40, px: 3 }}
                disabled={loading}
              >
                {loading ? "جاري البحث..." : "🔍 بحث"}
              </Button>

              {/* زر إظهار الكل */}
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ height: 40, px: 3 }}
                disabled={loading}
              >
                إظهار الكل
              </Button>
            </Box>
          </CardContent>
        </Card>

        {showTable && (
          <Paper sx={{ width: "100%", mt: 2, mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">الإجراءات</TableCell>
                  <TableCell align="center">التاريخ</TableCell>
                  <TableCell align="center">الوصف</TableCell>
                  <TableCell align="center">المبلغ</TableCell>
                  <TableCell align="center">النوع</TableCell>
                  <TableCell align="center">التسلسل</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((t, i) => (
                    <TableRow key={t.id}>
                      <TableCell align="center">
                        {t.documentId ? (
                          <Typography color="text.secondary" fontSize={13}>
                            مرتبط بمستند
                          </Typography>
                        ) : (
                          <div>
                            <IconButton
                              color="primary"
                              onClick={() => openForm(t)}
                              title="تعديل"
                              disabled={loading}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => requestDelete(t)}
                              title="حذف"
                              disabled={loading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </div>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {new Date(t.createdAt).toLocaleString("ar-EG")}
                      </TableCell>
                      <TableCell align="center">{t.details}</TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          color: t.type === "add" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {t.type === "add" ? "+" : "-"}
                        {t.amount}
                      </TableCell>
                      <TableCell align="center">
                        {t.type === "add" ? "إضافة" : "سحب"}
                      </TableCell>
                      <TableCell align="center">{i + 1}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      لا توجد حركات في الفترة المحددة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
            {editId ? "تعديل الحركة" : "إضافة مبلغ"}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" gap={2} mb={2} mt={1}>
              <TextField
                label="الوصف"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                inputProps={{ maxLength: 100 }}
                sx={{ flex: 1 }}
                fullWidth
              />
              <TextField
                label="المبلغ"
                value={amount}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) && setAmount(e.target.value)
                }
                error={!!error}
                helperText={error}
                inputProps={{ style: { textAlign: "left", direction: "ltr" } }}
                sx={{ width: 200 }}
              />
            </Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as "add" | "withdraw")}
              >
                <MenuItem value="add">إضافة</MenuItem>
                <MenuItem value="withdraw">سحب</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 4, mb: 1, mt: 1 }}>
            <Button
              onClick={() => setShowDialog(false)}
              color="secondary"
              variant="outlined"
              sx={{ width: 100, height: 40 }}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              sx={{ width: 100, height: 40 }}
              disabled={loading}
            >
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
          <DialogContent>
            <Typography>
              هل أنت متأكد أنك تريد حذف هذه الحركة؟ لا يمكن التراجع!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
            <Button
              onClick={() => setConfirmDelete(false)}
              color="secondary"
              variant="outlined"
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
              حذف
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
