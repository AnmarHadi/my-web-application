// src/pages/DriversPage.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ProvinceDropdown from "../components/ProvinceDropdown";

type Driver = {
  id: string;
  first: string;
  father: string;
  grandfather: string;
  fourth: string;
  last: string;
  fullName: string;
  phone: string;
  licenseEnd: string;
  frontImage: string;
  backImage: string;

  motherFirst?: string;
  motherFather?: string;
  motherGrandfather?: string;
  birthDate?: string;
  nationalId?: string;
  province?: string;
  areaAddress?: string;
  idFrontImage?: string;
  idBackImage?: string;
};

export default function DriversPage() {
  const [searchName, setSearchName] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);

  // نافذة عرض التفاصيل
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const [fields, setFields] = useState<{
    first: string;
    father: string;
    grandfather: string;
    fourth: string;
    last: string;

    motherFirst: string;
    motherFather: string;
    motherGrandfather: string;
    birthDate: string;
    nationalId: string;
    province: string;
    areaAddress: string;

    phone: string;
    licenseEnd: string;

    frontImage: File | null;
    frontImageUrl: string;
    backImage: File | null;
    backImageUrl: string;

    idFrontImage: File | null;
    idFrontImageUrl: string;
    idBackImage: File | null;
    idBackImageUrl: string;
  }>({
    first: "",
    father: "",
    grandfather: "",
    fourth: "",
    last: "",
    motherFirst: "",
    motherFather: "",
    motherGrandfather: "",
    birthDate: "",
    nationalId: "",
    province: "",
    areaAddress: "",
    phone: "",
    licenseEnd: "",
    frontImage: null,
    frontImageUrl: "",
    backImage: null,
    backImageUrl: "",
    idFrontImage: null,
    idFrontImageUrl: "",
    idBackImage: null,
    idBackImageUrl: "",
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const phoneValid = /^07\d{9}$/.test(fields.phone);
  const nationalIdValid = /^\d{12}$/.test(fields.nationalId);
  const allNamesFilled = [fields.first, fields.father, fields.grandfather, fields.fourth, fields.last].every((x) => x.trim());
  const allMotherFilled = [fields.motherFirst, fields.motherFather, fields.motherGrandfather].every((x) => x.trim());
  const licenseDateFilled = !!fields.licenseEnd;
  const maxBirthDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  })();
  const isAdult = (() => (!fields.birthDate ? false : fields.birthDate <= maxBirthDate))();
  const provinceFilled = !!fields.province;
  const addressFilled = !!fields.areaAddress.trim();
  const atLeastOneLicenseImage = editId ? true : fields.frontImage || fields.backImage;
  const atLeastOneIdImage = editId ? true : fields.idFrontImage || fields.idBackImage;

  const canSave =
    allNamesFilled &&
    allMotherFilled &&
    isAdult &&
    nationalIdValid &&
    provinceFilled &&
    addressFilled &&
    phoneValid &&
    licenseDateFilled &&
    atLeastOneLicenseImage &&
    atLeastOneIdImage;

  const fetchDrivers = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const url = query ? `/api/drivers?q=${encodeURIComponent(query)}` : `/api/drivers`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل في جلب النتائج");
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data.reverse() : []);
    } catch (err) {
      setError("خطأ في الاتصال بالخادم");
      setDrivers([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setShowAll(false);
    fetchDrivers(searchName);
  };
  const handleShowAll = () => {
    setSearchName("");
    setShowAll(true);
    fetchDrivers();
  };
  const handleExcelUpload = () => {
    setSuccess(true);
  };

  const resetFields = () =>
    setFields({
      first: "",
      father: "",
      grandfather: "",
      fourth: "",
      last: "",
      motherFirst: "",
      motherFather: "",
      motherGrandfather: "",
      birthDate: "",
      nationalId: "",
      province: "",
      areaAddress: "",
      phone: "",
      licenseEnd: "",
      frontImage: null,
      frontImageUrl: "",
      backImage: null,
      backImageUrl: "",
      idFrontImage: null,
      idFrontImageUrl: "",
      idBackImage: null,
      idBackImageUrl: "",
    });

  const handleEdit = (driver: Driver) => {
    setFields({
      first: driver.first,
      father: driver.father,
      grandfather: driver.grandfather,
      fourth: driver.fourth,
      last: driver.last,
      motherFirst: driver.motherFirst || "",
      motherFather: driver.motherFather || "",
      motherGrandfather: driver.motherGrandfather || "",
      birthDate: driver.birthDate || "",
      nationalId: driver.nationalId || "",
      province: driver.province || "",
      areaAddress: driver.areaAddress || "",
      phone: driver.phone,
      licenseEnd: driver.licenseEnd,
      frontImage: null,
      frontImageUrl: driver.frontImage || "",
      backImage: null,
      backImageUrl: driver.backImage || "",
      idFrontImage: null,
      idFrontImageUrl: driver.idFrontImage || "",
      idBackImage: null,
      idBackImageUrl: driver.idBackImage || "",
    });
    setEditId(driver.id);
    setOpenDialog(true);
  };

  const handleImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "frontImage" | "backImage" | "idFrontImage" | "idBackImage"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFields((f) => ({ ...f, [key]: file, [(key + "Url") as any]: URL.createObjectURL(file) }));
    }
  };
  const handleRemoveImage = (key: "frontImage" | "backImage" | "idFrontImage" | "idBackImage") => {
    setFields((f) => ({ ...f, [key]: null, [(key + "Url") as any]: "" }));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("first", fields.first);
    formData.append("father", fields.father);
    formData.append("grandfather", fields.grandfather);
    formData.append("fourth", fields.fourth);
    formData.append("last", fields.last);

    formData.append("motherFirst", fields.motherFirst);
    formData.append("motherFather", fields.motherFather);
    formData.append("motherGrandfather", fields.motherGrandfather);
    formData.append("birthDate", fields.birthDate);
    formData.append("nationalId", fields.nationalId);
    formData.append("province", fields.province);
    formData.append("areaAddress", fields.areaAddress);

    formData.append("phone", fields.phone);
    formData.append("licenseEnd", fields.licenseEnd);

    if (fields.frontImage) formData.append("frontImage", fields.frontImage);
    if (fields.backImage) formData.append("backImage", fields.backImage);
    if (fields.idFrontImage) formData.append("idFrontImage", fields.idFrontImage);
    if (fields.idBackImage) formData.append("idBackImage", fields.idBackImage);

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/drivers/${editId}`, { method: "PUT", body: formData });
      } else {
        res = await fetch("/api/drivers", { method: "POST", body: formData });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "فشل في حفظ البيانات");
        return;
      }
      setSuccess(true);
      resetFields();
      setOpenDialog(false);
      setEditId(null);
      if (showAll) fetchDrivers();
      else if (searchName) fetchDrivers(searchName);
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    }
  };

  const handleAskDelete = (id: string) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/drivers/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      setDrivers((prev) => prev.filter((d) => d.id !== deleteId));
      setSuccess(true);
    } catch {
      setError("حدث خطأ أثناء الحذف");
    } finally {
      setConfirmDelete(false);
      setDeleteId(null);
      if (showAll) fetchDrivers();
      else if (searchName) fetchDrivers(searchName);
    }
  };

  const searchHeight = 56;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        fontFamily: "Cairo, Arial, Tahoma, sans-serif",
        direction: "rtl",
        width: "100%",
      }}
    >
      <Typography variant="h4" align="center" fontWeight={700} sx={{ mb: 3 }}>
        إدارة السائقين
      </Typography>

      <Stack
        direction="row"
        gap={2}
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%", direction: "ltr", mb: 2 }}
      >
        <TextField
          label="بحث عن اسم السائق"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          fullWidth
          sx={{ flex: 3, height: searchHeight, "& .MuiInputBase-root": { height: searchHeight } }}
          inputProps={{ style: { textAlign: "right", direction: "rtl", height: searchHeight - 18 } }}
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ fontWeight: "bold", fontSize: 16, flex: 1, height: searchHeight, minWidth: 0 }}
          onClick={handleSearch}
          disabled={!searchName}
        >
          بحث
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          sx={{
            fontWeight: "bold",
            fontSize: 16,
            flex: 1,
            height: searchHeight,
            minWidth: 0,
            borderColor: "#c2185b",
            color: "#c2185b",
          }}
          onClick={handleShowAll}
        >
          إظهار الكل
        </Button>
      </Stack>

      <Button
        variant="outlined"
        color="info"
        startIcon={<UploadFileIcon />}
        sx={{ fontWeight: 700, fontSize: 16, borderRadius: 2, width: "100%", mt: 0.2, mb: 1, height: 38 }}
        component="label"
      >
        رفع من Excel
        <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
      </Button>

      <Button
        variant="contained"
        color="success"
        startIcon={<AddIcon />}
        sx={{ fontWeight: 700, fontSize: 16, borderRadius: 2, mt: 0.2, mb: 2, width: "100%" }}
        onClick={() => {
          setOpenDialog(true);
          setEditId(null);
          resetFields();
        }}
      >
        إضافة سائق جديد
      </Button>

      <Paper sx={{ width: "100%", mt: 2, p: 1 }}>
        {loading && (
          <Box sx={{ textAlign: "center", my: 2 }}>
            <CircularProgress color="primary" />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {!loading && !error && drivers.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                {/* الترتيب المطلوب: */}
                <TableCell align="center">الإجراءات</TableCell>
                <TableCell align="center">ص. هوية خلفية</TableCell>
                <TableCell align="center">ص. هوية أمامية</TableCell>
                <TableCell align="center">صورة الرخصة الخلفية</TableCell>
                <TableCell align="center">صورة الرخصة الأمامية</TableCell>
                <TableCell align="center">تاريخ انتهاء رخصة السوق</TableCell>
                <TableCell align="center">رقم الهاتف</TableCell>
                <TableCell align="center">اسم السائق</TableCell>
                <TableCell align="center">تسلسل</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell align="center">
                    <IconButton color="info" onClick={() => { setViewDriver(d); setViewOpen(true); }}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => handleEdit(d)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleAskDelete(d.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell align="center">
                    {d.idBackImage && (
                      <img src={d.idBackImage} alt="" style={{ width: 55, borderRadius: 4, border: "1px solid #bbb" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {d.idFrontImage && (
                      <img src={d.idFrontImage} alt="" style={{ width: 55, borderRadius: 4, border: "1px solid #bbb" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {d.backImage && (
                      <img src={d.backImage} alt="" style={{ width: 55, borderRadius: 4, border: "1px solid #bbb" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {d.frontImage && (
                      <img src={d.frontImage} alt="" style={{ width: 55, borderRadius: 4, border: "1px solid #bbb" }} />
                    )}
                  </TableCell>
                  <TableCell align="center">{d.licenseEnd}</TableCell>
                  <TableCell align="center">{d.phone}</TableCell>
                  <TableCell align="center">
                    {[d.first, d.father, d.grandfather, d.fourth, d.last].join(" ")}
                  </TableCell>
                  <TableCell align="center">{i + 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && !error && drivers.length === 0 && (showAll || searchName) && (
          <Typography align="center" sx={{ my: 2 }}>
            لا توجد بيانات مطابقة
          </Typography>
        )}
      </Paper>

      {/* نافذة عرض التفاصيل */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>تفاصيل السائق</DialogTitle>
        <DialogContent dividers>
          {viewDriver &&
            (() => {
              const motherFullName = [viewDriver.motherFirst, viewDriver.motherFather, viewDriver.motherGrandfather]
                .filter(Boolean)
                .join(" ");
              return (
                <>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableBody>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700, width: 220 }}>
                          الاسم الكامل
                        </TableCell>
                        <TableCell align="right">
                          {[viewDriver.first, viewDriver.father, viewDriver.grandfather, viewDriver.fourth, viewDriver.last]
                            .filter(Boolean)
                            .join(" ")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          اسم الأم الثلاثي
                        </TableCell>
                        <TableCell align="right">{motherFullName || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          تاريخ الولادة
                        </TableCell>
                        <TableCell align="right">{viewDriver.birthDate || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          رقم البطاقة الوطنية
                        </TableCell>
                        <TableCell align="right">{viewDriver.nationalId || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          المحافظة
                        </TableCell>
                        <TableCell align="right">{viewDriver.province || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          اسم المنطقة والعنوان
                        </TableCell>
                        <TableCell align="right">{viewDriver.areaAddress || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          رقم الهاتف
                        </TableCell>
                        <TableCell align="right">{viewDriver.phone || "-"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          تاريخ انتهاء إجازة السوق
                        </TableCell>
                        <TableCell align="right">{viewDriver.licenseEnd || "-"}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Typography sx={{ fontWeight: 700, mb: 1 }}>الصور</Typography>

                  {/* شبكة CSS بديلة لـ Grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        وجه البطاقة الوطنية
                      </Typography>
                      {viewDriver.idFrontImage ? (
                        <img
                          src={viewDriver.idFrontImage}
                          alt=""
                          style={{ width: "100%", border: "1px solid #bbb", borderRadius: 6 }}
                        />
                      ) : (
                        <Typography color="text.secondary">لا توجد</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        خلف البطاقة الوطنية
                      </Typography>
                      {viewDriver.idBackImage ? (
                        <img
                          src={viewDriver.idBackImage}
                          alt=""
                          style={{ width: "100%", border: "1px solid #bbb", borderRadius: 6 }}
                        />
                      ) : (
                        <Typography color="text.secondary">لا توجد</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        وجه رخصة السوق
                      </Typography>
                      {viewDriver.frontImage ? (
                        <img
                          src={viewDriver.frontImage}
                          alt=""
                          style={{ width: "100%", border: "1px solid #bbb", borderRadius: 6 }}
                        />
                      ) : (
                        <Typography color="text.secondary">لا توجد</Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        خلف رخصة السوق
                      </Typography>
                      {viewDriver.backImage ? (
                        <img
                          src={viewDriver.backImage}
                          alt=""
                          style={{ width: "100%", border: "1px solid #bbb", borderRadius: 6 }}
                        />
                      ) : (
                        <Typography color="text.secondary">لا توجد</Typography>
                      )}
                    </Box>
                  </Box>
                </>
              );
            })()}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={() => setViewOpen(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* نافذة إضافة/تعديل */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setEditId(null);
          resetFields();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold", mb: 2 }}>
          {editId ? "تعديل بيانات السائق" : "إضافة سائق جديد"}
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 1 }}>
          {/* الأسماء */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse",
              gap: 2,
              mb: 2,
              pt: 1,
              width: "100%",
              maxWidth: 620,
              minWidth: 300,
            }}
          >
            <TextField
              label="الاسم"
              value={fields.first}
              onChange={(e) => setFields((f) => ({ ...f, first: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="الأب"
              value={fields.father}
              onChange={(e) => setFields((f) => ({ ...f, father: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="الجد"
              value={fields.grandfather}
              onChange={(e) => setFields((f) => ({ ...f, grandfather: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="الرابع"
              value={fields.fourth}
              onChange={(e) => setFields((f) => ({ ...f, fourth: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="اللقب"
              value={fields.last}
              onChange={(e) => setFields((f) => ({ ...f, last: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
          </Box>

          {/* أم السائق */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row-reverse",
              gap: 2,
              mb: 2,
              width: "100%",
              maxWidth: 620,
              minWidth: 300,
            }}
          >
            <TextField
              label="اسم الأم"
              value={fields.motherFirst}
              onChange={(e) => setFields((f) => ({ ...f, motherFirst: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="أب الأم"
              value={fields.motherFather}
              onChange={(e) => setFields((f) => ({ ...f, motherFather: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
            <TextField
              label="جد الأم"
              value={fields.motherGrandfather}
              onChange={(e) => setFields((f) => ({ ...f, motherGrandfather: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
            />
          </Box>

          {/* تاريخ الولادة */}
          <TextField
            label="تاريخ الولادة"
            type="date"
            value={fields.birthDate}
            onChange={(e) => setFields((f) => ({ ...f, birthDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ max: maxBirthDate }}
            error={!!fields.birthDate && !isAdult}
            helperText={fields.birthDate && !isAdult ? "العمر يجب أن يكون 18 سنة فأكثر" : ""}
          />

          {/* رقم البطاقة الوطنية */}
          <TextField
            label="رقم البطاقة الوطنية"
            value={fields.nationalId}
            onChange={(e) =>
              setFields((f) => ({ ...f, nationalId: e.target.value.replace(/\D/g, "").slice(0, 12) }))
            }
            inputProps={{ inputMode: "numeric", pattern: "\\d*", maxLength: 12, style: { direction: "ltr", textAlign: "left" } }}
            fullWidth
            error={!!fields.nationalId && !nationalIdValid}
            helperText={fields.nationalId && !nationalIdValid ? "يجب أن يتكوّن من 12 رقمًا" : ""}
            sx={{ mb: 2 }}
          />

          {/* المحافظة */}
          <Box sx={{ mb: 2 }}>
            <ProvinceDropdown value={fields.province} onChange={(v: string) => setFields((f) => ({ ...f, province: v }))} />
          </Box>

          {/* المنطقة/العنوان */}
          <TextField
            label="اسم المنطقة والعنوان"
            value={fields.areaAddress}
            onChange={(e) => setFields((f) => ({ ...f, areaAddress: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
            inputProps={{ style: { textAlign: "right", direction: "rtl" } }}
          />

          {/* رقم الهاتف */}
          <TextField
            label="رقم هاتف السائق"
            value={fields.phone}
            onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))}
            inputProps={{ maxLength: 11, style: { textAlign: "left", direction: "ltr" } }}
            fullWidth
            error={Boolean(fields.phone) && !phoneValid}
            helperText={fields.phone && !phoneValid ? "رقم الهاتف يجب أن يبدأ بـ 07 ويتكون من 11 رقمًا" : ""}
            sx={{ mb: 2 }}
          />

          {/* صور البطاقة الوطنية */}
          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ fontWeight: 700, mb: 1, width: "100%" }}>
            رفع صورة البطاقة الوطنية (الوجه)
            <input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "idFrontImage")} />
          </Button>
          {fields.idFrontImageUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                maxHeight: 230,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 2,
                background: "#fafbfc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                mx: "auto",
                mb: 2,
              }}
            >
              <img
                src={fields.idFrontImageUrl}
                alt="وجه البطاقة الوطنية"
                style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: 6, display: "block" }}
              />
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 8, left: 8, background: "#fff", zIndex: 2 }}
                onClick={() => handleRemoveImage("idFrontImage")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ fontWeight: 700, mb: 1, width: "100%" }}>
            صورة خلف البطاقة الوطنية
            <input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "idBackImage")} />
          </Button>
          {fields.idBackImageUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                maxHeight: 230,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 2,
                background: "#fafbfc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                mx: "auto",
                mb: 2,
              }}
            >
              <img
                src={fields.idBackImageUrl}
                alt="خلف البطاقة الوطنية"
                style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: 6, display: "block" }}
              />
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 8, left: 8, background: "#fff", zIndex: 2 }}
                onClick={() => handleRemoveImage("idBackImage")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* تاريخ انتهاء إجازة السوق */}
          <TextField
            label="تاريخ انتهاء إجازة السوق"
            type="date"
            value={fields.licenseEnd}
            onChange={(e) => setFields((f) => ({ ...f, licenseEnd: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2 }}
          />

          {/* صور رخصة السوق */}
          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ fontWeight: 700, mb: 1, width: "100%" }}>
            رفع صورة وجه رخصة السوق
            <input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "frontImage")} />
          </Button>
          {fields.frontImageUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                maxHeight: 230,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 2,
                background: "#fafbfc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                mx: "auto",
                mb: 2,
              }}
            >
              <img
                src={fields.frontImageUrl}
                alt="وجه رخصة السوق"
                style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: 6, display: "block" }}
              />
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 8, left: 8, background: "#fff", zIndex: 2 }}
                onClick={() => handleRemoveImage("frontImage")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          <Button variant="outlined" component="label" startIcon={<PhotoCamera />} sx={{ fontWeight: 700, mb: 1, width: "100%" }}>
            رفع صورة خلف رخصة السوق
            <input type="file" accept="image/*" hidden onChange={(e) => handleImage(e, "backImage")} />
          </Button>
          {fields.backImageUrl && (
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                maxHeight: 230,
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: 2,
                background: "#fafbfc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                mx: "auto",
                mb: 2,
              }}
            >
              <img
                src={fields.backImageUrl}
                alt="خلف رخصة السوق"
                style={{ width: "100%", height: "auto", objectFit: "contain", borderRadius: 6, display: "block" }}
              />
              <IconButton
                size="small"
                sx={{ position: "absolute", top: 8, left: 8, background: "#fff", zIndex: 2 }}
                onClick={() => handleRemoveImage("backImage")}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 2, justifyContent: "center" }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setEditId(null);
              resetFields();
            }}
            color="secondary"
            fullWidth
            sx={{ fontWeight: 700, minWidth: 140 }}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            fullWidth
            sx={{ fontWeight: 700, minWidth: 140 }}
            disabled={!canSave}
          >
            {editId ? "حفظ التعديلات" : "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* تأكيد حذف */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد أنك تريد حذف هذا السائق؟ لا يمكن التراجع!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} color="secondary">
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف نهائي
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={2500} onClose={() => setSuccess(false)}>
        <Alert severity="success" onClose={() => setSuccess(false)} sx={{ fontWeight: 700, fontSize: 17 }}>
          تم حفظ البيانات بنجاح!
        </Alert>
      </Snackbar>

      {error && (
        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
