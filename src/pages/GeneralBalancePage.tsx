// src/pages/GeneralBalancePage.tsx
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import * as XLSX from "xlsx";

type Transaction = {
  id: string;
  amount: number;
  details: string;
  createdAt: string;
  type: "add" | "withdraw";
};

export default function GeneralBalancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [type, setType] = useState<"add" | "withdraw">("add");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (withFilter: boolean = false) => {
    try {
      let url = "/api/general-balance";
      if (withFilter && fromDate) {
        const to = toDate || new Date().toISOString().split("T")[0];
        url += `?from=${fromDate}&to=${to}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    }
  };

  const getNetBalance = () =>
    transactions.reduce(
      (sum, t) => sum + (t.type === "add" ? t.amount : -t.amount),
      0
    );

  const handleSave = async () => {
    if (!amount.trim() || isNaN(+amount) || !details.trim()) {
      setError("يرجى إدخال كل الحقول بشكل صحيح");
      return;
    }
    const body = { amount: +amount, details, type };
    const req = editId
      ? fetch(`/api/general-balance/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : fetch("/api/general-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    const res = await req;
    if (res.ok) {
      setOpenDialog(false);
      setAmount("");
      setDetails("");
      setEditId(null);
      setError("");
      fetchTransactions();
    } else {
      const err = await res.json();
      setError(err.error || "حدث خطأ أثناء الحفظ");
    }
  };

  const handleEdit = (tr: Transaction) => {
    setEditId(tr.id);
    setAmount(tr.amount.toString());
    setDetails(tr.details);
    setType(tr.type);
    setOpenDialog(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/general-balance/${deleteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setConfirmDelete(false);
      setDeleteId(null);
      fetchTransactions();
    }
  };

  const exportToExcel = () => {
    const wsData = [
      ["التسلسل", "المبلغ", "التفاصيل", "التاريخ"],
      ...transactions.map((tr, idx) => [
        idx + 1,
        `${tr.type === "add" ? "+" : "-"}${Math.abs(tr.amount)}`,
        tr.details,
        new Date(tr.createdAt).toLocaleString("ar-EG"),
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الرصيد العام");
    XLSX.writeFile(workbook, "الرصيد_العام.xlsx");
  };

  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 1100, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} align="center" mb={3}>
        الرصيد العام
      </Typography>

      <Box
        sx={{
          backgroundColor: "#f0f0f0",
          py: 2,
          borderRadius: 2,
          mb: 4,
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        صافي الرصيد الحالي:&nbsp;
        <Typography
          component="span"
          sx={{ color: "#388e3c", fontWeight: "bold", fontSize: 24 }}
        >
          {getNetBalance().toLocaleString("ar-EG")} دينار
        </Typography>
      </Box>

      {/* Search component */}
      {/* مكوّن البحث بالترتيب المعكوس */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 3,
        }}
      >
        {/* زر إظهار الكل */}
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => {
            setFromDate("");
            setToDate("");
            fetchTransactions();
            setHasSearched(true);
          }}
          sx={{ height: "40px" }}
        >
          إظهار الكل
        </Button>

        {/* زر بحث */}
        <Button
          variant="contained"
          color="info"
          onClick={() => {
            fetchTransactions(true);
            setHasSearched(true);
          }}
          sx={{ height: "40px" }}
        >
          بحث
        </Button>

        {/* إلى تاريخ */}
        <TextField
          type="date"
          label="إلى تاريخ"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            width: 150,
            "& input": {
              height: "40px",
              boxSizing: "border-box",
            },
          }}
        />

        {/* من تاريخ */}
        <TextField
          type="date"
          label="من تاريخ"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            width: 150,
            "& input": {
              height: "40px",
              boxSizing: "border-box",
            },
          }}
        />
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mb: 2 }}>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            setOpenDialog(true);
            setAmount("");
            setDetails("");
            setType("withdraw");
            setEditId(null);
            setError("");
          }}
        >
          سحب مبلغ
        </Button>
        <Button variant="contained" color="primary" onClick={exportToExcel}>
          حفظ Excel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => {
            setOpenDialog(true);
            setAmount("");
            setDetails("");
            setType("add");
            setEditId(null);
            setError("");
          }}
        >
          إضافة مبلغ
        </Button>
      </Box>

      {/* Table (shown after search or show all) */}
      {hasSearched && transactions.length > 0 && (
        <Paper sx={{ width: "100%", overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">الإجراءات</TableCell>
                <TableCell align="center">التاريخ</TableCell>
                <TableCell align="center">التفاصيل</TableCell>
                <TableCell align="center">المبلغ</TableCell>
                <TableCell align="center">التسلسل</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tr, idx) => (
                <TableRow key={tr.id}>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEdit(tr)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setDeleteId(tr.id);
                        setConfirmDelete(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    {new Date(tr.createdAt).toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell align="center">{tr.details}</TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      color: tr.type === "add" ? "green" : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {tr.type === "add" ? "+" : "-"}
                    {Math.abs(tr.amount).toLocaleString("ar-EG")}
                  </TableCell>
                  <TableCell align="center">{idx + 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs">
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          {editId ? "تعديل الحركة" : type === "add" ? "إضافة مبلغ" : "سحب مبلغ"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
          <TextField
            label="المبلغ"
            value={amount}
            onChange={(e) => /^\d*$/.test(e.target.value) && setAmount(e.target.value)}
            sx={{ mb: 2, width: 220, input: { textAlign: "left", direction: "ltr" } }}
            error={!!error}
            helperText={error}
            autoFocus
          />
          <TextField
            label="تفاصيل الحركة"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            sx={{ width: 220 }}
            inputProps={{ maxLength: 100 }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="secondary" variant="outlined" sx={{ width: 90 }}>
            إلغاء
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" sx={{ width: 90 }}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد أنك تريد حذف هذه الحركة؟ لا يمكن التراجع!</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} color="secondary" variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
