// src/pages/VehiclesPage.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Alert, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import axios from "axios";
import { useMemo } from "react";
import api from "../api";

const provinces = [
  "", "بغداد", "البصرة", "نينوى", "النجف", "كربلاء", "الأنبار",
  "ذي قار", "ميسان", "كركوك", "بابل", "ديالى", "صلاح الدين", "واسط",
  "الديوانية", "المثنى", "اربيل", "دهوك", "السليمانية"
];

function getImageUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) path = path.slice(1);
  return `/${path}`;
}

function getDateStatus(dateString?: string | null) {
  if (!dateString) return null;
  const now = new Date();
  const end = new Date(dateString);
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
}

function getFieldStatus(date?: string, image?: string) {
  if (!date || !image) return { label: "ناقصة", status: "missing", color: "#ffeb99", textColor: "#f57c00" };
  const dStatus = getDateStatus(date);
  if (dStatus === "expired") return { label: "منتهية", status: "expired", color: "#ffeaea", textColor: "#d32f2f" };
  if (dStatus === "expiring") return { label: "قرب الانتهاء", status: "expiring", color: "#fff4e1", textColor: "#f57c00" };
  return { label: "مكتملة", status: "valid", color: "#e7f7ee", textColor: "#388e3c" };
}

type ContractorT = { _id: string; name: string };

type VehicleT = {
  id: string;
  number: string;
  province?: string;
  contractor?: string;
  contractorName?: string;
  wheelType?: string;      // نوع العجلة
  ownerName?: string;      // اسم المالك
  ownerAddress?: string;   // العنوان
  annualEnd?: string;
  annualImage?: string;    // من الخادم: مسار أو URL
  checkupEnd?: string;
  checkupImage?: string;   // من الخادم: مسار أو URL
};

// حالة نموذج الإضافة/التعديل محليًا (تقبل File أو string أو null)
type VehicleForm = {
  id: string;
  number: string;
  province: string;
  contractor: string;
  contractorName: string;
  wheelType: string;
  ownerName: string;
  ownerAddress: string;
  annualEnd: string;
  annualImage: File | string | null;
  checkupEnd: string;
  checkupImage: File | string | null;
};

export default function VehiclesPage() {
  const [searchNumber, setSearchNumber] = useState("");
  const [searchProvince, setSearchProvince] = useState("");
  const [searchContractor, setSearchContractor] = useState("");
  const [vehicles, setVehicles] = useState<VehicleT[]>([]);
  const [contractors, setContractors] = useState<ContractorT[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("success");
  const [searched, setSearched] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const emptyVehicle: VehicleForm = {
    id: "",
    number: "",
    province: "",
    contractor: "",
    contractorName: "",
    wheelType: "",
    ownerName: "",
    ownerAddress: "",
    annualEnd: "",
    annualImage: null,
    checkupEnd: "",
    checkupImage: null,
  };

  const [newVehicle, setNewVehicle] = useState<VehicleForm>({ ...emptyVehicle });

  useEffect(() => {
    api.get("/contractors").then(res => {
      setContractors(res.data || []);
    });
  }, []);

  const handleSearch = async () => {
    setSearched(true);
    try {
      let query: string[] = [];
      if (searchNumber) query.push(`number=${encodeURIComponent(searchNumber)}`);
      if (searchProvince) query.push(`province=${encodeURIComponent(searchProvince)}`);
      if (searchContractor) query.push(`contractor=${encodeURIComponent(searchContractor)}`);
      const res = await api.get(`/vehicles?${query.join("&")}`);
      setVehicles(res.data || []);
      setMessage("");
    } catch {
      setVehicles([]);
      setMessage("فشل الاتصال بالخادم أو لا يوجد نتائج");
      setMessageType("error");
    }
  };

  const handleExcelUpload = () => {
    setMessage("ميزة رفع من Excel لم تُنفذ بعد.");
    setMessageType("info");
  };

  const handleOpenDialog = () => {
    setIsEditing(false);
    setEditVehicleId(null);
    setNewVehicle({ ...emptyVehicle });
    setOpenDialog(true);
  };

  const handleEditVehicle = (vehicle: VehicleT) => {
    setIsEditing(true);
    setEditVehicleId(vehicle.id);
    setNewVehicle({
      id: vehicle.id,
      number: vehicle.number || "",
      province: vehicle.province || "",
      contractor: vehicle.contractor || "",
      contractorName: vehicle.contractorName || "",
      wheelType: vehicle.wheelType || "",
      ownerName: vehicle.ownerName || "",
      ownerAddress: vehicle.ownerAddress || "",
      annualEnd: vehicle.annualEnd || "",
      annualImage: vehicle.annualImage || null,   // قد تكون string (مسار) أو null
      checkupEnd: vehicle.checkupEnd || "",
      checkupImage: vehicle.checkupImage || null, // قد تكون string (مسار) أو null
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setEditVehicleId(null);
    setNewVehicle({ ...emptyVehicle });
  };

  const handleScanCheckupImage = async () => {
    setMessage("");
    try {
      const res = await fetch("http://127.0.0.1:5123/scan", { method: "POST" });
      if (!res.ok) throw new Error("فشل في جلب الصورة من السكنر");
      const blob = await res.blob();
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
      setNewVehicle(v => ({ ...v, checkupImage: file }));
      setMessage("تم سحب صورة شهادة التكييل من السكنر بنجاح");
      setMessageType("success");
    } catch {
      setMessage("لم يتم جلب الصورة من السكنر، تحقق من الخدمة أو السكنر");
      setMessageType("error");
    }
  };

  const handleSaveVehicle = async () => {
    try {
      const formData = new FormData();
      formData.append("number", newVehicle.number || "");
      formData.append("province", newVehicle.province || "");
      formData.append("contractor", newVehicle.contractor || "");
      formData.append("wheelType", newVehicle.wheelType || "");
      formData.append("ownerName", newVehicle.ownerName || "");
      formData.append("ownerAddress", newVehicle.ownerAddress || "");
      formData.append("annualEnd", newVehicle.annualEnd || "");
      formData.append("checkupEnd", newVehicle.checkupEnd || "");

      const aImg = newVehicle.annualImage;
      if (aImg && aImg instanceof File) formData.append("annualImage", aImg);
      const cImg = newVehicle.checkupImage;
      if (cImg && cImg instanceof File) formData.append("checkupImage", cImg);

      if (!isEditing) {
        await api.post("/vehicles", formData, { headers: { "Content-Type": "multipart/form-data" }});
        setMessage("تمت إضافة المركبة بنجاح");
        setMessageType("success");
      } else {
        await api.put(`/vehicles/${editVehicleId}`, formData, { headers: { "Content-Type": "multipart/form-data" }});
        setMessage("تم تحديث بيانات المركبة بنجاح");
        setMessageType("success");
      }
      handleCloseDialog();
      handleSearch();
    } catch (err: any) {
      if (err?.response && err.response.status === 409) {
        setMessage("رقم المركبة موجود بالفعل في نفس المحافظة!");
      } else {
        setMessage("حدث خطأ أثناء الحفظ");
      }
      setMessageType("error");
    }
  };

  const handleDeleteVehicle = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("هل تريد حذف هذه المركبة نهائيًا؟")) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setMessage("تم حذف المركبة بنجاح");
      setMessageType("success");
      handleSearch();
    } catch {
      setMessage("حدث خطأ أثناء الحذف");
      setMessageType("error");
    }
  };

  const getContractorName = (id?: string) =>
    contractors.find((c) => c._id === id)?.name || "";

  function getRowColor(
    annual: { date?: string; image?: string },
    checkup: { date?: string; image?: string }
  ) {
    if (
      getFieldStatus(annual.date, annual.image).status === "expired" ||
      getFieldStatus(checkup.date, checkup.image).status === "expired"
    ) {
      return "#ffeaea";
    }
    return "inherit";
  }

  function handlePreview(imgUrl: string, title: string) {
    setPreviewUrl(getImageUrl(imgUrl));
    setPreviewTitle(title);
    setPreviewOpen(true);
  }
  function handleClosePreview() {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewTitle("");
  }

  const provinceOptions = provinces.slice(1);

  // الأعمدة (منطقية)
  const columns: {
    key: string;
    header: string;
    render: (v: VehicleT, idx: number) => React.ReactNode;
  }[] = [
    {
      key: "actions",
      header: "الإجراءات",
      render: (v) => (
        <>
          <IconButton color="primary" onClick={() => handleEditVehicle(v)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteVehicle(v.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      )
    },
    { key: "idx", header: "تسلسل", render: (_v, i) => i + 1 },
    { key: "number", header: "رقم المركبة", render: (v) => v.number },
    { key: "wheelType", header: "نوع العجلة", render: (v) => v.wheelType || "-" },
    { key: "ownerName", header: "اسم المالك", render: (v) => v.ownerName || "-" },
    { key: "contractor", header: "اسم المتعهد", render: (v) => getContractorName(v.contractor) || v.contractorName || "-" },
    {
      key: "annualStatus",
      header: "حالة السنوية",
      render: (v) => {
        const st = getFieldStatus(v.annualEnd, v.annualImage);
        return (
          <>
            <span style={{ color: st.textColor as any, fontWeight: 700 }}>{st.label}</span>
            {v.annualImage && (
              <Tooltip title="معاينة صورة السنوية">
                <IconButton size="small" onClick={() => handlePreview(v.annualImage!, "صورة السنوية")} sx={{ ml: 1 }}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      }
    },
    {
      key: "checkupStatus",
      header: "حالة شهادة التكييل",
      render: (v) => {
        const st = getFieldStatus(v.checkupEnd, v.checkupImage);
        return (
          <>
            <span style={{ color: st.textColor as any, fontWeight: 700 }}>{st.label}</span>
            {v.checkupImage && (
              <Tooltip title="معاينة صورة شهادة التكييل">
                <IconButton size="small" onClick={() => handlePreview(v.checkupImage!, "صورة شهادة التكييل")} sx={{ ml: 1 }}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      }
    },
    { key: "annualEnd", header: "تاريخ انتهاء السنوية", render: (v) => v.annualEnd || "-" },
    { key: "checkupEnd", header: "تاريخ انتهاء شهادة التكييل", render: (v) => v.checkupEnd || "-" },
    { key: "province", header: "المحافظة", render: (v) => v.province || "-" },
    { key: "ownerAddress", header: "العنوان", render: (v) => v.ownerAddress || "-" },
  ];

  // للعرض RTL: الإجراءات أول عمود بصريًا، وبقية الأعمدة معكوسة
  const columnsRtl = useMemo(() => {
    const actions = columns.find(c => c.key === "actions")!;
    const withoutActions = columns.filter(c => c.key !== "actions");
    return [actions, ...withoutActions.reverse()];
  }, [columns]);

  // Sticky للإجراءات على اليسار
  const stickyHeadSx = { position: "sticky" as const, left: 0, backgroundColor: "#fff", zIndex: 3, boxShadow: "1px 0 0 #eee inset" };
  const stickyCellSx = { position: "sticky" as const, left: 0, backgroundColor: "#fff", zIndex: 2, boxShadow: "1px 0 0 #eee inset" };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        px: { xs: 1, md: 8 },
        fontFamily: "Cairo, Arial, Tahoma, sans-serif",
        direction: "rtl",
      }}
    >
      <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 4 }}>
        إدارة المركبات
      </Typography>
      {message && (
        <Alert severity={messageType} sx={{ width: "100%", mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* البحث */}
      <Box sx={{ width: "100%", maxWidth: "100%", mb: 2, mx: "auto" }}>
        <Stack direction="row" gap={2} alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
          <Button variant="contained" color="primary" sx={{ fontWeight: "bold", height: 56, flex: 1, minWidth: 110 }} fullWidth onClick={handleSearch}>
            بحث
          </Button>

          <Autocomplete
            options={contractors}
            getOptionLabel={opt => opt.name || ""}
            value={contractors.find(c => c._id === searchContractor) || null}
            onChange={(_, newValue) => setSearchContractor(newValue ? newValue._id : "")}
            renderInput={params => (
              <TextField
                {...params}
                label="اسم المتعهد"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: !!searchContractor }}
                inputProps={{ ...params.inputProps, style: { textAlign: "left", direction: "ltr" } }}
              />
            )}
            sx={{ minWidth: 180, flex: 1 }}
            isOptionEqualToValue={(opt, val) => opt._id === val?._id}
            clearOnBlur={false}
            autoHighlight
          />

          <Autocomplete
            options={provinceOptions}
            value={searchProvince || null}
            onChange={(_, newValue) => setSearchProvince(newValue || "")}
            renderInput={params => (
              <TextField
                {...params}
                label="المحافظة"
                variant="outlined"
                fullWidth
                InputLabelProps={{ shrink: !!searchProvince }}
                inputProps={{ ...params.inputProps, style: { textAlign: "left", direction: "ltr" } }}
              />
            )}
            sx={{ minWidth: 180, flex: 1 }}
            isOptionEqualToValue={(opt, val) => opt === val}
            clearOnBlur={false}
            autoHighlight
          />

          <TextField
            label="رقم المركبة"
            value={searchNumber}
            onChange={e => setSearchNumber(e.target.value)}
            fullWidth
            sx={{ flex: 1, minWidth: 110, input: { textAlign: "left", direction: "ltr" } }}
            inputProps={{ style: { textAlign: "left", direction: "ltr" } }}
          />
        </Stack>

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<UploadFileIcon />}
          sx={{ fontWeight: "bold", height: 48, fontSize: 16, width: "100%", mt: 2, mb: 2, maxWidth: "100%" }}
          component="label"
          fullWidth
        >
          رفع من Excel
          <input type="file" accept=".xlsx,.xls" hidden ref={excelInputRef} onChange={handleExcelUpload} />
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          sx={{ fontWeight: "bold", height: 48, fontSize: 16, width: "100%", maxWidth: "100%", borderRadius: 2, mb: 2 }}
          onClick={handleOpenDialog}
          fullWidth
        >
          إضافة مركبة جديدة
        </Button>
      </Box>

      {/* جدول المركبات — الإجراءات أول عمود وثابت */}
      {searched && (
        <Paper sx={{ mt: 2 }}>
          <Box sx={{ overflowX: "auto", position: "relative" }}>
            <Table sx={{ direction: "rtl", minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  {columnsRtl.map(col => (
                    <TableCell
                      key={col.key}
                      align="center"
                      sx={col.key === "actions" ? stickyHeadSx : undefined}
                    >
                      {col.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {vehicles.length > 0 ? (
                  [...vehicles].reverse().map((v, idx) => {
                    const annual = { date: v.annualEnd, image: v.annualImage };
                    const checkup = { date: v.checkupEnd, image: v.checkupImage };
                    const rowColor = getRowColor(annual, checkup);

                    return (
                      <TableRow key={v.id || idx} sx={{ backgroundColor: rowColor, transition: "background 0.2s" }}>
                        {columnsRtl.map(col => (
                          <TableCell
                            key={col.key}
                            align="center"
                            sx={col.key === "actions" ? stickyCellSx : undefined}
                          >
                            {col.render(v, idx)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell align="center" colSpan={columnsRtl.length}>لا توجد نتائج مطابقة</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {/* معاينة الصور */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>{previewTitle}</DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <img src={previewUrl} alt={previewTitle} style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8, border: "1px solid #ccc" }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="secondary" fullWidth sx={{ fontWeight: 700 }}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة إضافة/تعديل مركبة */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold" sx={{ textAlign: "center" }}>
          {isEditing ? "تعديل بيانات المركبة" : "إضافة مركبة جديدة"}
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Autocomplete
              options={contractors}
              getOptionLabel={opt => opt.name || ""}
              value={contractors.find(c => c._id === newVehicle.contractor) || null}
              onChange={(_, newValue) => setNewVehicle(v => ({ ...v, contractor: newValue ? newValue._id : "" }))}
              renderInput={params => (
                <TextField
                  {...params}
                  label="اسم المتعهد"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ shrink: !!newVehicle.contractor }}
                  inputProps={{ ...params.inputProps, style: { textAlign: "left", direction: "ltr" } }}
                />
              )}
              sx={{ minWidth: 180 }}
              isOptionEqualToValue={(opt, val) => opt._id === (val as any)?._id}
              clearOnBlur={false}
              autoHighlight
            />

            <TextField
              label="رقم المركبة"
              value={newVehicle.number}
              onChange={e => setNewVehicle(v => ({ ...v, number: e.target.value }))}
              fullWidth
              inputProps={{ maxLength: 20, dir: "ltr", style: { textAlign: "left" } }}
            />

            <Autocomplete
              options={provinces.slice(1)}
              value={newVehicle.province || null}
              onChange={(_, newValue) => setNewVehicle(v => ({ ...v, province: newValue || "" }))}
              renderInput={params => (
                <TextField
                  {...params}
                  label="المحافظة"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{ shrink: !!newVehicle.province }}
                  inputProps={{ ...params.inputProps, style: { textAlign: "left", direction: "ltr" } }}
                />
              )}
              sx={{ minWidth: 180 }}
              isOptionEqualToValue={(opt, val) => opt === val}
              clearOnBlur={false}
              autoHighlight
            />

            <TextField
              label="نوع العجلة"
              value={newVehicle.wheelType || ""}
              onChange={e => setNewVehicle(v => ({ ...v, wheelType: e.target.value }))}
              fullWidth
            />

            <TextField
              label="اسم المالك"
              value={newVehicle.ownerName || ""}
              onChange={e => setNewVehicle(v => ({ ...v, ownerName: e.target.value }))}
              fullWidth
            />

            <TextField
              label="العنوان"
              value={newVehicle.ownerAddress || ""}
              onChange={e => setNewVehicle(v => ({ ...v, ownerAddress: e.target.value }))}
              fullWidth
            />

            <TextField
              label="تاريخ انتهاء السنوية"
              type="date"
              value={newVehicle.annualEnd || ""}
              onChange={e => setNewVehicle(v => ({ ...v, annualEnd: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              inputProps={{ style: { textAlign: "left" } }}
            />
            <Button variant="outlined" fullWidth component="label">
              إضافة صورة السنوية
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e => setNewVehicle(v => ({ ...v, annualImage: e.target.files?.[0] || null }))}
              />
            </Button>

            <TextField
              label="تاريخ انتهاء شهادة التكييل"
              type="date"
              value={newVehicle.checkupEnd || ""}
              onChange={e => setNewVehicle(v => ({ ...v, checkupEnd: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              inputProps={{ style: { textAlign: "left" } }}
            />
            <Button variant="outlined" fullWidth component="label">
              إضافة صورة شهادة التكييل
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={e => setNewVehicle(v => ({ ...v, checkupImage: e.target.files?.[0] || null }))}
              />
            </Button>
            <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={handleScanCheckupImage}>
              سحب صورة شهادة التكييل من السكنر
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Button onClick={handleCloseDialog} color="secondary" sx={{ minWidth: 120, fontWeight: 700, flex: 1 }} fullWidth>
            إلغاء
          </Button>
          <Button
            onClick={handleSaveVehicle}
            color="primary"
            variant="contained"
            sx={{ minWidth: 120, fontWeight: 700, flex: 1 }}
            disabled={!newVehicle.number || !newVehicle.contractor}
            fullWidth
          >
            {isEditing ? "حفظ التغييرات" : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
