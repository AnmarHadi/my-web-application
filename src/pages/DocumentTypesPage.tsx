// src/pages/DocumentTypesPage.tsx
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

type DocumentType = { id: string; name: string };

export default function DocumentTypesPage() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const res = await fetch("/api/document-types");
    const data = await res.json();
    setTypes(data);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("يرجى إدخال نوع المستند");
      return;
    }
    let res: Response;
    if (editId) {
      res = await fetch(`/api/document-types/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } else {
      res = await fetch("/api/document-types", {
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
      fetchTypes();
    } else {
      const err = await res.json();
      setError(err.error || "حدث خطأ أثناء الإضافة");
    }
  };

  const handleEdit = (row: DocumentType) => {
    setEditId(row.id);
    setName(row.name);
    setOpenDialog(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/document-types/${deleteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setConfirmDelete(false);
      setDeleteId(null);
      fetchTypes();
    }
  };

  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} align="center" mb={3}>
        نوع المستند
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
        إضافة نوع مستند جديد
      </Button>
      <Paper sx={{ width: "100%", overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">نوع المستند</TableCell>
              <TableCell align="center">التسلسل</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((row, i) => (
              <TableRow key={row.id}>
                {/* الإجراءات */}
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setConfirmDelete(true);
                      setDeleteId(row.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                {/* نوع المستند */}
                <TableCell align="center">{row.name}</TableCell>
                {/* التسلسل */}
                <TableCell align="center">{i + 1}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* نافذة إضافة/تعديل نوع مستند */}
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
            m: "auto",
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: "center", fontWeight: "bold", mb: 1, fontSize: 21 }}
        >
          إضافة مستند جديد
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 1 }}
        >
          <TextField
            label="نوع المستند"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{
              mt: 2,
              mb: 1.5,
              width: 220,
              input: { textAlign: "left", direction: "ltr" },
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

      {/* نافذة تأكيد الحذف */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد أنك تريد حذف نوع المستند؟</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button
            onClick={() => setConfirmDelete(false)}
            color="secondary"
            variant="outlined"
          >
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
