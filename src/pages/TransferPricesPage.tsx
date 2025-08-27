// frontend/src/pages/TransferPricesPage.tsx
import { useState, useEffect, useMemo } from "react";
import {
  Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, TextField, Select, FormControl, InputLabel, Stack, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, IconButton
} from "@mui/material";
import ProvinceDropdown from "../components/ProvinceDropdown";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/* ======================= Types ======================= */
type LocationT = {
  id: string;
  name: string;
  province: string;
  operationType: string;
};

type TransferPrice = {
  id: string;
  operationType: string;
  province: string;
  locationId: string;
  locationName: string;
  paymentType: string;
  price: number;
  advance: number;
  productId?: string | null;
  productName?: string | null;
};

type NajafPrice = {
  id: string;
  minLoad: number;
  maxLoad: number;
  price: number;
  advance: number;
};

type PriceForm = {
  operationType: string;
  province: string;
  locationId: string;
  paymentType: string;
  price: string;
  advance: string;
  productId?: string;
};

type NajafPriceForm = {
  minLoad: string;
  maxLoad: string;
  price: string;
  advance: string;
};

type ProductT = { id: string; name: string };

/* ======================= Component ======================= */
export default function TransferPricesPage() {
  // --- State ---
  const [locations, setLocations] = useState<LocationT[]>([]);
  const [allLocations, setAllLocations] = useState<LocationT[]>([]);
  const [products, setProducts] = useState<ProductT[]>([]);

  const [open, setOpen] = useState(false);
  const [openNajaf, setOpenNajaf] = useState(false);

  const [form, setForm] = useState<PriceForm>({
    operationType: "",
    province: "",
    locationId: "",
    paymentType: "",
    price: "",
    advance: "",
    productId: "",
  });

  const [najafForm, setNajafForm] = useState<NajafPriceForm>({
    minLoad: "",
    maxLoad: "",
    price: "",
    advance: "",
  });

  const [error, setError] = useState("");
  const [najafError, setNajafError] = useState("");

  // جدول الأسعار
  const [prices, setPrices] = useState<TransferPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<TransferPrice[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // نجف
  const [najafPrices, setNajafPrices] = useState<NajafPrice[]>([]);
  const [najafEditId, setNajafEditId] = useState<string | null>(null);
  const [najafDeleteId, setNajafDeleteId] = useState<string | null>(null);
  const [confirmDeleteNajaf, setConfirmDeleteNajaf] = useState(false);

  // البحث
  const [searchProvince, setSearchProvince] = useState("");
  const [searchLocationId, setSearchLocationId] = useState("");
  const [searchLocations, setSearchLocations] = useState<LocationT[]>([]);

  /* ======================= Data Fetch ======================= */
  useEffect(() => {
    // المواقع
    fetch("/api/locations")
      .then(res => res.json())
      .then(data => setAllLocations(Array.isArray(data) ? data : []))
      .catch(() => setAllLocations([]));

    // المنتجات
    fetch("/api/products")
      .then(res => res.json())
      .then((data) => {
        const mapped = Array.isArray(data)
          ? data.map((p: any) => ({ id: p.id || p._id, name: p.name }))
          : [];
        setProducts(mapped);
      })
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (searchProvince) {
      setSearchLocations(allLocations.filter(l => l.province === searchProvince));
    } else {
      setSearchLocations([]);
    }
    setSearchLocationId("");
  }, [searchProvince, allLocations]);

  useEffect(() => {
    if (form.province && form.operationType) {
      fetch(
        `/api/locations?province=${encodeURIComponent(form.province)}&operationType=${encodeURIComponent(form.operationType)}`
      )
        .then(res => res.json())
        .then(data => setLocations(Array.isArray(data) ? data : []))
        .catch(() => setLocations([]));
    } else {
      setLocations([]);
    }
    // لا نمسح form.locationId هنا لتفادي اختفاء القيمة عند التعديل
  }, [form.province, form.operationType]);

  // جلب أسعار النقلات
  const fetchPrices = async () => {
    const res = await fetch("/api/transfer-prices");
    const result = await res.json();
    setPrices(Array.isArray(result) ? result : []);
    setFilteredPrices(Array.isArray(result) ? result : []);
  };

  // جلب أسعار نقلات النجف
  const fetchNajafPrices = async () => {
    const res = await fetch("/api/najaf-transfer-prices");
    const result = await res.json();
    setNajafPrices(Array.isArray(result) ? result : []);
  };

  useEffect(() => {
    fetchPrices();
    fetchNajafPrices();
  }, []);

  /* ======================= Helpers ======================= */
  // عرض قيم قديمة "بالطن" كـ"بالكغم" في الواجهة
  const displayPaymentType = (t: string) => (t === "بالطن" ? "بالكغم" : t);

  const priceLabel = useMemo(() => {
    switch (form.paymentType) {
      case "مقطوعة":
        return "سعر النقلة الكلي";
      case "باللتر":
        return "سعر نقل اللتر الواحد";
      case "بالكغم":
        return "سعر نقل الكغم الواحد";
      default:
        return "سعر النقلة";
    }
  }, [form.paymentType]);

  /* ======================= Handlers ======================= */
  const handleChange = (k: keyof PriceForm, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };

      if (k === "province" || k === "operationType") next.locationId = "";

      if (k === "operationType") {
        if (v === "تحميل") {
          next.advance = "";
        } else {
          next.productId = "";
        }
      }

      if (k === "paymentType") {
        next.price = "";
      }

      return next;
    });
  };

  const handleSearch = () => {
    let filtered = prices;
    if (searchProvince) {
      filtered = filtered.filter(p => p.province === searchProvince);
    }
    if (searchLocationId) {
      filtered = filtered.filter(p => p.locationId === searchLocationId);
    }
    setFilteredPrices(filtered);
  };

  const handleSave = async () => {
    if (!form.operationType || !form.province || !form.locationId || !form.paymentType || !form.price) {
      setError("يرجى إدخال جميع الحقول المطلوبة");
      return;
    }
    if (form.operationType === "تحميل" && !form.productId) {
      setError("يرجى اختيار المنتوج عند نوع العملية (تحميل)");
      return;
    }

    const payload: any = {
      operationType: form.operationType,
      province: form.province,
      locationId: form.locationId,
      paymentType: form.paymentType, // سترسل "بالكغم" الآن
      price: Number(form.price || 0),
    };

    if (form.operationType === "تحميل") {
      payload.productId = form.productId || null;
    } else {
      payload.advance = Number(form.advance || 0);
    }

    let url = "/api/transfer-prices";
    let method = "POST";
    if (editId) {
      url = `/api/transfer-prices/${editId}`;
      method = "PUT";
    }

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setOpen(false);
    setError("");
    setForm({
      operationType: "",
      province: "",
      locationId: "",
      paymentType: "",
      price: "",
      advance: "",
      productId: "",
    });
    setEditId(null);
    fetchPrices();
  };

  const handleEdit = (row: TransferPrice) => {
    setForm({
      operationType: row.operationType,
      province: row.province,
      locationId: row.locationId,
      // تطبيع القيمة القديمة
      paymentType: displayPaymentType(row.paymentType),
      price: String(row.price),
      advance: row.advance ? String(row.advance) : "",
      productId: row.operationType === "تحميل" ? (row.productId || "") : "",
    });
    setOpen(true);
    setEditId(row.id);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/transfer-prices/${deleteId}`, { method: "DELETE" });
    setConfirmDelete(false);
    setDeleteId(null);
    fetchPrices();
  };

  // --- Najaf Logic ---
  const handleSaveNajaf = async () => {
    if (!najafForm.minLoad || !najafForm.maxLoad || !najafForm.price) {
      setNajafError("يرجى إدخال جميع الحقول المطلوبة");
      return;
    }
    let url = "/api/najaf-transfer-prices";
    let method = "POST";
    if (najafEditId) {
      url = `/api/najaf-transfer-prices/${najafEditId}`;
      method = "PUT";
    }
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(najafForm),
    });
    setOpenNajaf(false);
    setNajafError("");
    setNajafForm({ minLoad: "", maxLoad: "", price: "", advance: "" });
    setNajafEditId(null);
    fetchNajafPrices();
  };

  const handleEditNajaf = (row: NajafPrice) => {
    setNajafForm({
      minLoad: String(row.minLoad),
      maxLoad: String(row.maxLoad),
      price: String(row.price),
      advance: row.advance ? String(row.advance) : "",
    });
    setOpenNajaf(true);
    setNajafEditId(row.id);
    setNajafError("");
  };

  const handleDeleteNajaf = async () => {
    if (!najafDeleteId) return;
    await fetch(`/api/najaf-transfer-prices/${najafDeleteId}`, { method: "DELETE" });
    setConfirmDeleteNajaf(false);
    setNajafDeleteId(null);
    fetchNajafPrices();
  };

  // --- Constants ---
  const OPERATION_TYPES = [
    { value: "تحميل", label: "تحميل" },
    { value: "تفريغ", label: "تفريغ" },
  ];

  // ✅ استبدال "بالطن" بـ "بالكغم"
  const PAYMENT_TYPES = [
    { value: "مقطوعة", label: "مقطوعة" },
    { value: "باللتر", label: "باللتر" },
    { value: "بالكغم", label: "بالكغم" },
  ];

  /* ======================= UI ======================= */
  return (
    <Box sx={{ p: 3, direction: "rtl", maxWidth: 950, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} align="center" mb={3}>
        أسعار النقلات
      </Typography>

      <Button
        variant="contained"
        color="success"
        sx={{ mb: 2, width: "100%", maxWidth: 450, fontWeight: 700 }}
        onClick={() => {
          setOpen(true);
          setEditId(null);
          setForm({
            operationType: "",
            province: "",
            locationId: "",
            paymentType: "",
            price: "",
            advance: "",
            productId: "",
          });
        }}
      >
        إضافة سعر نقلة
      </Button>

      <Button
        variant="outlined"
        color="info"
        sx={{ mb: 2, width: "100%", maxWidth: 450, fontWeight: 700, ml: 2 }}
        onClick={() => {
          setOpenNajaf(true);
          setNajafEditId(null);
          setNajafForm({ minLoad: "", maxLoad: "", price: "", advance: "" });
        }}
      >
        إضافة سعر نقلات النجف
      </Button>

      {/* مكون البحث */}
      <Stack direction="row" spacing={2} sx={{ my: 2, maxWidth: 700 }}>
        <ProvinceDropdown
          value={searchProvince}
          onChange={setSearchProvince}
          sx={{ minWidth: 170 }}
        />
        <FormControl sx={{ minWidth: 170 }}>
          <InputLabel id="search-location-label">موقع الوجهة</InputLabel>
          <Select
            labelId="search-location-label"
            value={searchLocationId}
            label="موقع الوجهة"
            onChange={e => setSearchLocationId(e.target.value)}
            disabled={!searchProvince}
          >
            {searchLocations.length === 0 && (
              <MenuItem value="" disabled>لا توجد وجهات</MenuItem>
            )}
            {searchLocations.map(loc => (
              <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          sx={{ minWidth: 120, fontWeight: 700 }}
          onClick={handleSearch}
        >
          بحث
        </Button>
      </Stack>

      {/* جدول الأسعار العام */}
      <Paper sx={{ width: "100%", mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">المنتوج</TableCell>
              <TableCell align="center">مبلغ السلفة</TableCell>
              <TableCell align="center">سعر النقلة</TableCell>
              <TableCell align="center">نوع الدفع</TableCell>
              <TableCell align="center">موقع الوجهة</TableCell>
              <TableCell align="center">المحافظة</TableCell>
              <TableCell align="center">نوع العملية</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrices.map((row) => (
              <TableRow key={row.id}>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => { setDeleteId(row.id); setConfirmDelete(true); }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">
                  {row.operationType === "تحميل" ? (row.productName || "-") : "-"}
                </TableCell>
                <TableCell align="center">{row.operationType === "تحميل" ? "-" : row.advance}</TableCell>
                <TableCell align="center">{row.price}</TableCell>
                {/* نعرض "بالطن" القديمة كـ"بالكغم" */}
                <TableCell align="center">{displayPaymentType(row.paymentType)}</TableCell>
                <TableCell align="center">{row.locationName}</TableCell>
                <TableCell align="center">{row.province}</TableCell>
                <TableCell align="center">{row.operationType}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* جدول أسعار نقلات النجف */}
      <Paper sx={{ width: "100%", mt: 4 }}>
        <Typography variant="h6" fontWeight={700} align="center" sx={{ py: 2 }}>
          أسعار نقلات النجف (مقطوعة حسب الحمولة)
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">الإجراءات</TableCell>
              <TableCell align="center">السلفة</TableCell>
              <TableCell align="center">سعر النقلة</TableCell>
              <TableCell align="center">أعلى حمولة</TableCell>
              <TableCell align="center">أدنى حمولة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {najafPrices.map((row) => (
              <TableRow key={row.id}>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditNajaf(row)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setNajafDeleteId(row.id);
                      setConfirmDeleteNajaf(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center">{row.advance || ""}</TableCell>
                <TableCell align="center">{row.price}</TableCell>
                <TableCell align="center">{row.maxLoad}</TableCell>
                <TableCell align="center">{row.minLoad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* نافذة إضافة/تعديل سعر النقلة */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          {editId ? "تعديل سعر النقلة" : "إضافة سعر النقلة"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ width: 270 }}>
            <FormControl fullWidth>
              <InputLabel id="operation-type-label">نوع العملية</InputLabel>
              <Select
                labelId="operation-type-label"
                value={form.operationType}
                label="نوع العملية"
                onChange={e => handleChange("operationType", e.target.value)}
              >
                {OPERATION_TYPES.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ProvinceDropdown
              value={form.province}
              onChange={v => handleChange("province", v)}
              sx={{ width: "100%" }}
            />

            <FormControl fullWidth>
              <InputLabel id="location-label">موقع الوجهة</InputLabel>
              <Select
                labelId="location-label"
                value={form.locationId}
                label="موقع الوجهة"
                onChange={e => handleChange("locationId", e.target.value)}
                disabled={!form.province || !form.operationType}
                displayEmpty
                renderValue={(selected) => {
                  const v = (selected as string) || "";
                  const loc = locations.find(l => l.id === v);
                  return loc ? loc.name : "موقع الوجهة";
                }}
              >
                {locations.length === 0 && (
                  <MenuItem value="" disabled>لا توجد وجهات</MenuItem>
                )}
                {locations.map(loc => (
                  <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* قائمة المنتوج تظهر فقط عند (تحميل) */}
            {form.operationType === "تحميل" && (
              <FormControl fullWidth>
                <InputLabel id="product-label">المنتوج</InputLabel>
                <Select
                  labelId="product-label"
                  value={form.productId || ""}
                  label="المنتوج"
                  onChange={(e) => handleChange("productId", e.target.value)}
                >
                  {products.length === 0 && (
                    <MenuItem value="" disabled>لا توجد منتجات</MenuItem>
                  )}
                  {products.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth>
              <InputLabel id="payment-type-label">نوع الدفع</InputLabel>
              <Select
                labelId="payment-type-label"
                value={form.paymentType}
                label="نوع الدفع"
                onChange={e => handleChange("paymentType", e.target.value)}
              >
                {PAYMENT_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* سعر النقلة */}
            <TextField
              label={priceLabel}
              type="text"
              value={form.price}
              onChange={e => handleChange("price", e.target.value.replace(/[^\d]/g, ""))}
              fullWidth
            />

            {/* السلفة تظهر فقط إذا كانت العملية ≠ تحميل */}
            {form.operationType !== "تحميل" && (
              <TextField
                label="مبلغ السلفة"
                type="text"
                value={form.advance}
                onChange={e => handleChange("advance", e.target.value.replace(/[^\d]/g, ""))}
                fullWidth
              />
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button onClick={() => setOpen(false)} color="secondary" variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد حذف السعر العام */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد أنك تريد حذف هذا السعر؟ لا يمكن التراجع!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button onClick={() => setConfirmDelete(false)} color="secondary" variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة إضافة/تعديل سعر نقلات النجف */}
      <Dialog open={openNajaf} onClose={() => setOpenNajaf(false)} maxWidth="xs">
        <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
          {najafEditId ? "تعديل سعر نقلات النجف" : "إضافة سعر نقلات النجف"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ width: 270 }}>
            <TextField
              label="أدنى حمولة للسيارة"
              type="text"
              value={najafForm.minLoad}
              onChange={e => setNajafForm(f => ({ ...f, minLoad: e.target.value.replace(/[^\d]/g, "") }))}
              fullWidth
            />
            <TextField
              label="أعلى حمولة للسيارة"
              type="text"
              value={najafForm.maxLoad}
              onChange={e => setNajafForm(f => ({ ...f, maxLoad: e.target.value.replace(/[^\d]/g, "") }))}
              fullWidth
            />
            <TextField
              label="سعر النقلة"
              type="text"
              value={najafForm.price}
              onChange={e => setNajafForm(f => ({ ...f, price: e.target.value.replace(/[^\d]/g, "") }))}
              fullWidth
            />
            <TextField
              label="السلفة"
              type="text"
              value={najafForm.advance}
              onChange={e => setNajafForm(f => ({ ...f, advance: e.target.value.replace(/[^\d]/g, "") }))}
              fullWidth
            />
            {najafError && <Alert severity="error">{najafError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button onClick={() => setOpenNajaf(false)} color="secondary" variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleSaveNajaf} color="primary" variant="contained">
            حفظ
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد حذف سعر النجف */}
      <Dialog open={confirmDeleteNajaf} onClose={() => setConfirmDeleteNajaf(false)}>
        <DialogTitle sx={{ textAlign: "center" }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد أنك تريد حذف هذا السعر؟ لا يمكن التراجع!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 4 }}>
          <Button onClick={() => setConfirmDeleteNajaf(false)} color="secondary" variant="outlined">
            إلغاء
          </Button>
          <Button onClick={handleDeleteNajaf} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
