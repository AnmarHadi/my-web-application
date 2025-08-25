import { useState } from "react";
import {
  Box, Button, Typography, TextField, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from "@mui/material";
import ProvinceDropdown from "../components/ProvinceDropdown";
import OperationTypeField from "../components/OperationTypeField";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type LocationT = {
  id: string;
  name: string;
  province: string;
  operationType: string; // تحميل أو تفريغ
};

export default function LocationsPage() {
  const [searchName, setSearchName] = useState("");
  const [searchProvince, setSearchProvince] = useState("");
  const [searchType, setSearchType] = useState("");
  const [data, setData] = useState<LocationT[]>([]);
  const [showTable, setShowTable] = useState(false);

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [operationType, setOperationType] = useState("تحميل");
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteItem, setDeleteItem] = useState<LocationT | null>(null);

  // جلب البيانات
  const fetchData = async () => {
    let q = [];
    if (searchName.trim()) q.push(`name=${encodeURIComponent(searchName)}`);
    if (searchProvince) q.push(`province=${encodeURIComponent(searchProvince)}`);
    if (searchType) q.push(`operationType=${encodeURIComponent(searchType)}`);
    const res = await fetch(`/api/locations${q.length ? "?" + q.join("&") : ""}`);
    const result = await res.json();
    setData(result);
    setShowTable(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !province || !operationType) {
      setError("يرجى إدخال كل الحقول");
      return;
    }
    let res;
    if (editId) {
      res = await fetch(`/api/locations/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), province, operationType }),
      });
    } else {
      res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), province, operationType }),
      });
    }
    if (res.ok) {
      setOpenDialog(false);
      setName("");
      setProvince("");
      setOperationType("تحميل");
      setEditId(null);
      setError("");
      fetchData();
    } else {
      const err = await res.json();
      setError(err.error || "فشل في الحفظ");
    }
  };

  const handleEdit = (row: LocationT) => {
    setEditId(row.id);
    setName(row.name);
    setProvince(row.province);
    setOperationType(row.operationType);
    setOpenDialog(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const res = await fetch(`/api/locations/${deleteItem.id}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(false);
      setDeleteItem(null);
      fetchData();
    }
  };

  // نص خانة الاسم حسب نوع العملية
  const nameLabel =
    operationType === "تحميل"
      ? "اسم وجهة التحميل"
      : "اسم موقع التحميل";

  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 950, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} align="center" mb={3}>
        وجهات التحميل والتفريغ
      </Typography>

      {/* مكون البحث */}
      <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ height: 56, fontWeight: 700, minWidth: 110, flex: 1 }}
          onClick={fetchData}
        >
          بحث
        </Button>
        <OperationTypeField
          value={searchType}
          onChange={setSearchType}
          label="نوع العملية"
          sx={{ width: 170 }}
        />
        <ProvinceDropdown
          value={searchProvince}
          onChange={setSearchProvince}
          sx={{ flex: 1, minWidth: 150 }}
        />
        <TextField
          label="اسم الوجهة أو الموقع"
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          sx={{ flex: 2, minWidth: 230 }}
        />
      </Box>

      {/* زر رفع من إكسل */}
      <Button
        variant="outlined"
        color="info"
        startIcon={<UploadFileIcon />}
        sx={{
          mb: 2,
          fontWeight: 700,
          width: "100%",
          maxWidth: 950,
          minHeight: 42,
          fontSize: 17,
          letterSpacing: "1px"
        }}
        component="label"
      >
        رفع من Excel
        <input type="file" accept=".xlsx,.xls" hidden />
      </Button>

      {/* زر إضافة */}
      <Button
        variant="contained"
        color="success"
        sx={{
          mb: 2,
          width: "100%",
          maxWidth: 950,
          minHeight: 42,
          fontWeight: 700,
          fontSize: 17
        }}
        startIcon={<AddIcon />}
        onClick={() => {
          setOpenDialog(true);
          setEditId(null);
          setName("");
          setProvince("");
          setOperationType("تحميل");
          setError("");
        }}
      >
        إضافة وجهة تحميل أو تفريغ
      </Button>

      {/* جدول النتائج */}
      {showTable && (
  <Paper sx={{ width: "100%", mt: 2 }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell align="center">الإجراءات</TableCell>
          <TableCell align="center">المحافظة</TableCell>
          <TableCell align="center">اسم الوجهة أو الموقع</TableCell>
          <TableCell align="center">نوع العملية</TableCell>
          <TableCell align="center">التسلسل</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.slice().reverse().map((row, i) => (
          <TableRow key={row.id}>
            <TableCell align="center">
              <IconButton color="primary" onClick={() => handleEdit(row)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => { setDeleteItem(row); setConfirmDelete(true); }}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
            <TableCell align="center">{row.province}</TableCell>
            <TableCell align="center">{row.name}</TableCell>
            <TableCell align="center">{row.operationType}</TableCell>
            <TableCell align="center">{data.length - i}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
)}
      {/* نافذة إضافة/تعديل وجهة */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        PaperProps={{ sx: { minWidth: 310, maxWidth: 340, px: 2, py: 1.5, borderRadius: 3, textAlign: "center" } }}
      >
        <DialogTitle sx={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: 20,
          mb: 0    // حل التداخل: أضف هامشاً سفلياً هنا
        }}>
          {editId ? "تعديل وجهة" : "إضافة وجهة تحميل أو تفريغ"}
        </DialogTitle>
        <DialogContent sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          p: 1
        }}>
          <OperationTypeField
            value={operationType}
            onChange={setOperationType}
            label="نوع العملية"
            sx={{ width: 220, mt: 1, mb: 0.75 }}
          />
          <TextField
            label={nameLabel}
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{ mt: 1, mb: 1.5, width: 220, input: { textAlign: "left", direction: "ltr" } }}
            error={!!error}
            helperText={error}
            autoFocus
          />
          <ProvinceDropdown
            value={province}
            onChange={setProvince}
            sx={{ width: 220, mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4, mb: 1, mt: 1 }}>
          <Button onClick={() => setOpenDialog(false)} color="secondary" variant="outlined" sx={{ width: 90 }}>
            إلغاء
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" sx={{ width: 90 }}>
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد حذف */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد أنك تريد حذف الوجهة
            <b> {deleteItem?.name} </b>؟ لا يمكن التراجع!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button onClick={() => setConfirmDelete(false)} color="secondary" variant="outlined">إلغاء</Button>
          <Button onClick={handleDelete} color="error" variant="contained">حذف</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
