import { useState, useEffect } from "react";
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Table, TableBody, TableCell, TableHead, TableRow, Paper, IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Product = { id: string; name: string };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState<string>("");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("يرجى إدخال اسم المنتوج");
      return;
    }
    let res;
    if (editId) {
      res = await fetch(`/api/products/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } else {
      res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    }
    if (res.ok) {
      setName("");
      setOpenDialog(false);
      setEditId(null);
      setError("");
      fetchProducts();
    } else {
      const err = await res.json();
      setError(err.error || "حدث خطأ أثناء الإضافة");
    }
  };

  const handleEdit = (prod: Product) => {
    setEditId(prod.id);
    setName(prod.name);
    setOpenDialog(true);
    setError("");
  };

  // عند طلب الحذف
  const handleAskDelete = (id: string, productName: string) => {
    setDeleteId(id);
    setDeleteProductName(productName);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setConfirmDelete(false);
      setDeleteId(null);
      setDeleteProductName("");
      fetchProducts();
    }
  };

  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} align="center" mb={3}>
        المنتجات
      </Typography>
      <Button
        variant="contained"
        color="success"
        sx={{ mb: 2, width: "100%", fontWeight: 700 }}
        onClick={() => {
          setOpenDialog(true);
          setEditId(null);
          setName("");
          setError("");
        }}
      >
        إضافة منتج
      </Button>
      <Paper sx={{ width: "100%", overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">المنتوج</TableCell>
              <TableCell align="center">التسلسل</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((prod, i) => (
              <TableRow key={prod.id}>
                {/* الإجراءات */}
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(prod)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleAskDelete(prod.id, prod.name)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                {/* المنتوج */}
                <TableCell align="center">{prod.name}</TableCell>
                {/* التسلسل */}
                <TableCell align="center">{i + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* نافذة إضافة/تعديل منتج */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            minWidth: 310,
            maxWidth: 340,
            px: 2,
            py: 1.5,
            borderRadius: 3,
            textAlign: "center",
            m: "auto"
          }
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", mb: 1, fontSize: 21 }}>
          {editId ? "تعديل منتج" : "إضافة منتج"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 1 }}>
          <TextField
            label="اسم المنتوج"
            value={name}
            onChange={e => setName(e.target.value)}
            sx={{
              mt: 2,
              mb: 1.5,
              width: 220,
              input: { textAlign: "right", direction: "rtl" }
            }}
            error={!!error}
            helperText={error}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4, mb: 1, mt: 1 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            color="secondary"
            variant="outlined"
            sx={{ width: 90 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            sx={{ width: 90 }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد حذف مع اسم المنتوج */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد أنك تريد حذف المنتوج التالي؟
            <br />
            <b style={{ color: "#d32f2f", fontSize: 17 }}>{deleteProductName}</b>
            <br />
            لا يمكن التراجع عن هذه العملية!
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
