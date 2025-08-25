// src/pages/UnloadingRegisterPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Paper, Stack, Button, Typography, Alert, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, Divider,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { Html5Qrcode } from "html5-qrcode";

/** ====== أنواع البيانات ====== */
type Row = {
  id: string;
  docNo: string;
  createdAt: string;
  operationType: string;      // تحميل
  paymentType: string;        // "مقطوعة" | "باللتر" | "بالكغم"
  unit: string;               // لتر | كغم
  loadedQty: number;
  total: number;              // سعر النقلة إن كان مقطوعة (من المستند)
  advance: number;            // السلفة
  province: string;           // مهم لجلب سعر اللتر/الكغم
  locationId: string;         // مهم لجلب سعر اللتر/الكغم
  driver?: { name: string; phone?: string } | null;
  vehicle?: { number: string; province?: string; wheelType?: string; ownerName?: string } | null;
  product?: { name: string; unit?: string } | null;
  location?: { name: string } | null;
};

type EditState = { qty: string; date: string; unitRate: number; finalTotal: string };

/** ====== حوار الكاميرا ====== */
function QRScannerDialog({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}) {
  const [err, setErr] = useState<string>("");
  const elementId = "qr-reader-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      setErr("");
      const el = document.getElementById(elementId);
      if (!el) {
        setErr("تعذر العثور على عنصر الكاميرا في الصفحة.");
        return;
      }
      if (scannerRef.current) return;

      scannerRef.current = new Html5Qrcode(elementId, false);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 280 },
        (decodedText) => {
          onScan(decodedText);
          // أوقف الماسح ثم أغلق الحوار
          stopScanner().finally(onClose);
        },
        () => {}
      );
    } catch (e: any) {
      setErr(e?.message || "تعذّر فتح الكاميرا. تأكد من السماح بالصلاحيات.");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        const s = scannerRef.current;
        scannerRef.current = null;
        // لا تستخدم .catch على دوال قد تكون معرفة كـ void في تعريفات النوع
        try { await s.stop(); } catch {}
        try { await s.clear(); } catch {}
      }
    } catch {}
  };

  useEffect(() => {
    if (!open) stopScanner();
    return () => { stopScanner(); };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth keepMounted TransitionProps={{ onEntered: startScanner }}>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        مسح QR بالكاميرا
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box id={elementId} sx={{ width: "100%", minHeight: 300 }} />
        {!!err && <Alert sx={{ mt: 2 }} severity="error">{err}</Alert>}
        {!err && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
            وجّه الكاميرا نحو رمز الـ QR…
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} fullWidth>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

/** ====== الصفحة ====== */
export default function UnloadingRegisterPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  // فلاتر
  const [qrText, setQrText] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // تحرير السطور
  const [edit, setEdit] = useState<Record<string, EditState>>({});

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [cameraOpen, setCameraOpen] = useState(false);

  // === جلب سعر الوحدة من أسعار النقلات ===
  const fetchUnitRate = async (province: string, locationId: string, unit: string) => {
    try {
      const needPayment = unit === "لتر" ? "باللتر" : "بالكغم";
      const url =
        `/api/transfer-prices?province=${encodeURIComponent(province)}` +
        `&locationId=${encodeURIComponent(locationId)}` +
        `&operationType=${encodeURIComponent("تفريغ")}` +
        `&paymentType=${encodeURIComponent(needPayment)}`;

      const res = await fetch(url);
      if (!res.ok) return 0;
      const arr = await res.json();
      return Number(arr?.[0]?.price || 0);
    } catch {
      return 0;
    }
  };

  /** — تهيئة حالة التحرير لكل سطر مع جلب سعر الوحدة — */
  const initEditForList = async (list: Row[]) => {
    const map: Record<string, EditState> = {};
    const rates = await Promise.all(
      list.map(async (r) => {
        if (r.paymentType === "مقطوعة") return 0;
        return await fetchUnitRate(r.province, r.locationId, r.unit);
      })
    );
    list.forEach((r, idx) => {
      const unitRate = rates[idx] || 0;
      map[r.id] = {
        qty: "",
        date: today,
        unitRate,
        finalTotal: r.paymentType === "مقطوعة" ? String(r.total ?? "") : "",
      };
    });
    setEdit(map);
  };

  /** — جلب حسب الفلاتر — */
  const fetchByFilters = async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (docNumber) params.set("docNumber", docNumber.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/unloading/pending?${params.toString()}`);
      if (!res.ok) throw new Error("فشل في جلب المستندات");
      const data: Row[] = await res.json();
      setRows(Array.isArray(data) ? data : []);
      await initEditForList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      setEdit({});
      setError(e?.message || "خطأ غير معروف");
    }
  };

  /** — جلب عبر QR — */
  const fetchByQR = async (codeParam?: string) => {
    setError("");
    const code = (codeParam ?? qrText).trim();
    if (!code) {
      setError("أدخل نص QR أولاً");
      return;
    }
    try {
      const res = await fetch(`/api/unloading/qr?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "لا يوجد مستند مطابق");
      }
      const r: Row = await res.json();
      setRows([r]);
      await initEditForList([r]);
    } catch (e: any) {
      setRows([]);
      setEdit({});
      setError(e?.message || "فشل قراءة QR");
    }
  };

  /** — حفظ سطر — */
  const handleSaveRow = async (r: Row) => {
    setError("");
    const st = edit[r.id] || { qty: "", date: today, unitRate: 0, finalTotal: "" };
    const qty = Number(st.qty);
    if (!qty || qty <= 0) {
      setError("أدخل كمية تفريغ صالحة");
      return;
    }

    // احسب النهائي تلقائيًا للأنواع بالوحدة
    let finalTotal = r.paymentType === "مقطوعة"
      ? Number(r.total || 0)
      : Number((st.unitRate || 0) * qty);

    if (r.paymentType !== "مقطوعة" && (!finalTotal || finalTotal <= 0)) {
      setError("تعذر حساب سعر النقلة؛ تأكد من توفّر سعر اللتر/الكغم في أسعار النقلات.");
      return;
    }

    const payload: any = {
      unloadingQty: qty,
      unloadingDate: st.date || today,
      finalTotal,
    };

    try {
      const res = await fetch(`/api/unloading/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "فشل حفظ التفريغ");
      }
      setRows((prev) => prev.filter((x) => x.id !== r.id));
      const next = { ...edit };
      delete next[r.id];
      setEdit(next);
    } catch (e: any) {
      setError(e?.message || "فشل حفظ التفريغ");
    }
  };

  /** ====== واجهة المستخدم ====== */
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, direction: "rtl", fontFamily: "Cairo, Arial, Tahoma, sans-serif" }}>
      <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 2 }}>
        تسجيل التفريغ
      </Typography>

      {/* البحث السريع (العنوان بالمنتصف) */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }} align="center">
          البحث السريع
        </Typography>
        <Stack
          direction="row-reverse"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
          alignItems="center"
          sx={{
            "& .MuiTextField-root input": { direction: "ltr", textAlign: "left" },
            "& .MuiInputBase-input": { direction: "ltr", textAlign: "left" },
          }}
        >
          <TextField
            label="نص QR الوصل"
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            sx={{ minWidth: 240, flex: 1 }}
          />
          <Button variant="outlined" startIcon={<QrCodeScannerIcon />} onClick={() => setCameraOpen(true)} sx={{ height: 48 }}>
            فتح الكاميرا
          </Button>
          <Button variant="outlined" onClick={() => fetchByQR()} sx={{ height: 48 }}>
            جلب عبر QR
          </Button>

          <TextField
            label="رقم المستند"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <TextField label="من تاريخ" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="إلى تاريخ" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchByFilters} sx={{ height: 48 }}>
            بحث
          </Button>
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Divider sx={{ mb: 2 }} />

      {/* الجدول */}
      <Paper sx={{ p: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              {/* ترتيب مقلوب مناسب للـ RTL */}
              <TableCell align="center">حفظ</TableCell>
              <TableCell align="center">المتبقي</TableCell>
              <TableCell align="center">سعر النقلة الكلي</TableCell>
              <TableCell align="center">سعر (باللتر/بالكغم)</TableCell>
              <TableCell align="center" style={{ minWidth: 160 }}>تاريخ التفريغ</TableCell>
              <TableCell align="center" style={{ minWidth: 150 }}>كمية التفريغ</TableCell>
              {/* تمت إزالة عمود "المبلغ" */}
              <TableCell align="center">السلفة</TableCell>
              <TableCell align="center">نوع الدفع</TableCell>
              <TableCell align="center">كمية التحميل</TableCell>
              <TableCell align="center">الوحدة</TableCell>
              <TableCell align="center">المنتج</TableCell>
              <TableCell align="center">رقم المركبة</TableCell>
              <TableCell align="center">السائق</TableCell>
              <TableCell align="center">تاريخ الإدخال</TableCell>
              <TableCell align="center">رقم المستند</TableCell>
              <TableCell align="center">تسلسل</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                {/* 16 عمود بعد حذف "المبلغ" */}
                <TableCell colSpan={16} align="center">لا توجد مستندات بانتظار التفريغ</TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => {
                const st = edit[r.id] || { qty: "", date: today, unitRate: 0, finalTotal: "" };
                const qtyNum = Number(st.qty || 0);
                const computedTotal =
                  r.paymentType === "مقطوعة"
                    ? Number(r.total || 0)
                    : Number((st.unitRate || 0) * qtyNum);
                const remaining = Math.max(computedTotal - Number(r.advance || 0), 0);

                return (
                  <TableRow key={r.id}>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleSaveRow(r)}>
                        <SaveIcon />
                      </IconButton>
                    </TableCell>

                    <TableCell align="center">{computedTotal ? remaining.toLocaleString() : "-"}</TableCell>
                    <TableCell align="center">{computedTotal ? computedTotal.toLocaleString() : "-"}</TableCell>
                    <TableCell align="center">
                      {r.paymentType === "مقطوعة" ? "—" : (st.unitRate || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="date"
                        value={st.date}
                        onChange={(e) => setEdit((prev) => ({ ...prev, [r.id]: { ...st, date: e.target.value } }))}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        value={st.qty}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^\d.]/g, "");
                          setEdit((prev) => ({
                            ...prev,
                            [r.id]: {
                              ...st,
                              qty: val,
                              finalTotal: r.paymentType === "مقطوعة" ? st.finalTotal : String((st.unitRate || 0) * Number(val || 0)),
                            },
                          }));
                        }}
                        placeholder="0"
                        size="small"
                        inputProps={{ style: { direction: "ltr", textAlign: "left" } }}
                      />
                    </TableCell>

                    {/* تم حذف خلية "المبلغ" */}
                    <TableCell align="center">{r.advance ?? "-"}</TableCell>
                    <TableCell align="center">{r.paymentType}</TableCell>
                    <TableCell align="center">{r.loadedQty}</TableCell>
                    <TableCell align="center">{r.unit}</TableCell>
                    <TableCell align="center">{r.product?.name || "-"}</TableCell>
                    <TableCell align="center">{r.vehicle?.number || "-"}</TableCell>
                    <TableCell align="center">{r.driver?.name || "-"}</TableCell>
                    <TableCell align="center">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{r.docNo}</TableCell>
                    <TableCell align="center">{i + 1}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* الكاميرا */}
      <QRScannerDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={(text) => {
          setQrText(text);
          setTimeout(() => fetchByQR(text), 50);
        }}
      />
    </Box>
  );
}
