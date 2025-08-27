/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MutableRefObject,
  type ChangeEvent,
} from "react";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Card,
  Paper,
  Chip,
  Stack,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { arSA } from "date-fns/locale";
import ProvinceDropdown from "../components/ProvinceDropdown";
import ScannerHttp from "../components/ScannerHttp";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import RefreshIcon from "@mui/icons-material/Refresh";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { forwardRef } from "react";

/* ===== ثوابت وأنواع ===== */
const ENGLISH_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
type OptionT = { id: string; name?: string };
type NajafPriceT = {
  id: string;
  minLoad: number;
  maxLoad: number;
  price: number;
  advance: number;
};
type ExtraOrDiscountItem = { amount: string; desc: string };
type PrintDataT = {
  receiptNumber: string;
  documentDate: Date;
  operationType: string;
  documentLetter: string;
  documentNumber: string;
  vehicle?: OptionT;
  driver?: OptionT;
  province: string;
  location?: OptionT;
  product?: OptionT;
  unit: string;
  quantity: string;
  extraItems: ExtraOrDiscountItem[];
  discountItems: ExtraOrDiscountItem[];
  price: number; // الإجمالي (0 عند التسعير بالوحدة)
  advance: number;
  totalAdvance: number;
  remaining: number; // 0 عند التسعير بالوحدة
  paymentType?: string; // "مقطوعة" | "باللتر" | "بالكغم"
  unitRate?: number; // سعر الوحدة عند التسعير بالوحدة
};

/* ===== مكوّن الطباعة ===== */
const PrintReceipt = forwardRef<HTMLDivElement, { data: PrintDataT | null }>(
  (props, ref) => {
    const { data } = props;
    if (!data) return null;

    const isUnitBased =
      data.paymentType === "باللتر" ||
      data.paymentType === "بالكغم" ||
      (data.operationType === "تحميل" && data.paymentType !== "مقطوعة");

    const unitLabel =
      data.paymentType === "باللتر" ? "لتر" : data.paymentType === "بالكغم" ? "كغم" : "وحدة";

    const formatDate = (d: Date) =>
      d.toLocaleDateString("ar-EG", {
        calendar: "gregory",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const formatDateTime = (d: Date) =>
      d.toLocaleString("ar-EG", {
        calendar: "gregory",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

    const printTime = new Date();

    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: 24,
          background: "#fff",
          direction: "rtl",
          fontFamily: "Cairo, Arial, Tahoma, sans-serif",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography fontWeight={700}>رقم الوصل: {data.receiptNumber}</Typography>
            <Typography sx={{ fontSize: 14 }}>
              تاريخ الطباعة: {formatDateTime(printTime)}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h5" align="center" fontWeight={700} gutterBottom>
          وصل مستند ــ {data.operationType}
        </Typography>

        <Table sx={{ mb: 3 }}>
          <TableBody>
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                رقم المستند
              </TableCell>
              <TableCell align="center">
                {data.documentLetter}
                {data.documentNumber}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                تاريخه
              </TableCell>
              <TableCell align="center">{formatDate(data.documentDate)}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                رقم المركبة
              </TableCell>
              <TableCell align="center">{data.vehicle?.name}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                اسم السائق
              </TableCell>
              <TableCell align="center">{data.driver?.name}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                المحافظة
              </TableCell>
              <TableCell align="center">{data.province}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {data.operationType === "تحميل" ? "وجهة التحميل" : "وجهة التفريغ"}
              </TableCell>
              <TableCell align="center">{data.location?.name}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                {data.operationType === "تحميل" ? "الكمية المحملة" : "الكمية المفرغة"}
              </TableCell>
              <TableCell align="center">
                {data.quantity} {data.unit}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                المنتوج
              </TableCell>
              <TableCell align="center">{data.product?.name}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Table sx={{ mb: 1, width: "80%", mx: "auto" }}>
          <TableHead>
            <TableRow>
              {["سعر النقلة", "السلفة", "مبلغ إضافي", "خصم", "صافي المسلم للسائق", "المتبقي"].map(
                (h) => (
                  <TableCell key={h} align="center" sx={{ fontWeight: 700 }}>
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell align="center">
                {isUnitBased
                  ? `معلّق (سعر ${unitLabel} الواحد: ${(data.unitRate || 0).toLocaleString()})`
                  : data.price.toLocaleString()}
              </TableCell>
              <TableCell align="center">{data.advance.toLocaleString()}</TableCell>
              <TableCell align="center">
                {data.extraItems.reduce((s, x) => s + (Number(x.amount) || 0), 0).toLocaleString()}
              </TableCell>
              <TableCell align="center">
                {data.discountItems
                  .reduce((s, x) => s + (Number(x.amount) || 0), 0)
                  .toLocaleString()}
              </TableCell>
              <TableCell align="center">{data.totalAdvance.toLocaleString()}</TableCell>
              <TableCell align="center">{isUnitBased ? "—" : data.remaining.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <QRCode
            size={120}
            value={JSON.stringify({
              no: data.receiptNumber,
              dt: data.documentDate.toISOString(),
              op: data.operationType,
              doc: data.documentLetter + data.documentNumber,
              veh: data.vehicle?.name,
              drv: data.driver?.name,
              prov: data.province,
              loc: data.location?.name,
              qty: data.quantity,
              unit: data.unit,
              prod: data.product?.name,
              price: data.price,
              payType: data.paymentType,
              unitRate: data.unitRate,
              adv: data.advance,
              extra: data.extraItems.map((x) => x.amount).join("+"),
              disc: data.discountItems.map((x) => x.amount).join("+"),
              totAdv: data.totalAdvance,
              rem: data.remaining,
            })}
          />
        </Box>
      </div>
    );
  }
);

/* ====================== الصفحة الرئيسية ====================== */
export default function DocumentsEntryPage() {
  /* سكنر/صورة */
  const scannerRef = useRef<any>(null);
  const [scannedImage, setScannedImage] = useState<string>("");

  // اختيار صورة محليًا
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handlePickLocal = () => fileInputRef.current?.click();
  const handleLocalFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setScannedImage(url);
  };
  useEffect(() => {
    return () => {
      if (scannedImage?.startsWith("blob:")) URL.revokeObjectURL(scannedImage);
    };
  }, [scannedImage]);

  /* حقول النموذج */
  const [operationType, setOperationType] = useState("");
  const [documentDate, setDocumentDate] = useState<Date | null>(null);
  const [documentTypes, setDocumentTypes] = useState<OptionT[]>([]);
  const [documentType, setDocumentType] = useState("");
  const [documentLetter, setDocumentLetter] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  const [vehicles, setVehicles] = useState<OptionT[]>([]);
  const [vehicleId, setVehicleId] = useState("");

  const [drivers, setDrivers] = useState<OptionT[]>([]);
  const [driverId, setDriverId] = useState("");

  const [province, setProvince] = useState("");
  const [locations, setLocations] = useState<OptionT[]>([]);
  const [locationId, setLocationId] = useState("");

  const [products, setProducts] = useState<OptionT[]>([]);
  const [productId, setProductId] = useState("");

  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");

  const [transferPrice, setTransferPrice] = useState(0); // الإجمالي (0 عند الوحدة)
  const [advance, setAdvance] = useState(0);
  const [priceType, setPriceType] = useState<string>(""); // "مقطوعة" | "باللتر" | "بالكغم"
  const [unitRate, setUnitRate] = useState<number>(0);

  const [najafPrices, setNajafPrices] = useState<NajafPriceT[]>([]);
  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [printData, setPrintData] = useState<PrintDataT | null>(null);

  const [extraItems, setExtraItems] = useState<ExtraOrDiscountItem[]>([]);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [editingExtraIdx, setEditingExtraIdx] = useState<number | null>(null);
  const [extraAmountInput, setExtraAmountInput] = useState("");
  const [extraDescInput, setExtraDescInput] = useState("");

  const [discountItems, setDiscountItems] = useState<ExtraOrDiscountItem[]>([]);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [editingDiscountIdx, setEditingDiscountIdx] = useState<number | null>(null);
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [discountDescInput, setDiscountDescInput] = useState("");

  const [advance3, setAdvance3] = useState("");

  const [receiptNumber] = useState(() => {
    const last = Number(localStorage.getItem("lastReceipt") || 0) + 1;
    localStorage.setItem("lastReceipt", String(last));
    return `A${last.toString().padStart(6, "0")}`;
  });

  const printRef = useRef<HTMLDivElement>(null);

  /* ========== جلب البيانات المرجعية ========== */
  useEffect(() => {
    fetch("/api/document-types")
      .then((r) => r.json())
      .then((d) => {
        setDocumentTypes(
          Array.isArray(d) ? d.map((dt: any) => ({ id: dt.id || dt._id, name: dt.name })) : []
        );
      })
      .catch(() => setDocumentTypes([]));

    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        setVehicles(
          Array.isArray(d)
            ? d.map((v: any) => ({
                id: v.id || v._id,
                name: `${v.number}   ${v.province}`,
              }))
            : []
        );
      })
      .catch(() => setVehicles([]));

    fetch("/api/drivers")
      .then((r) => r.json())
      .then((d) => {
        setDrivers(
          Array.isArray(d)
            ? d.map((dr: any) => ({
                id: dr.id || dr._id,
                name: dr.name || dr.fullName,
              }))
            : []
        );
      })
      .catch(() => setDrivers([]));

    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        setProducts(
          Array.isArray(d) ? d.map((p: any) => ({ id: p.id || p._id, name: p.name })) : []
        );
      })
      .catch(() => setProducts([]));

    fetch("/api/najaf-transfer-prices")
      .then((r) => r.json())
      .then((d) => setNajafPrices(Array.isArray(d) ? d : []))
      .catch(() => setNajafPrices([]));
  }, []);

  useEffect(() => {
    if (province && operationType) {
      fetch(
        `/api/locations?province=${encodeURIComponent(
          province
        )}&operationType=${encodeURIComponent(operationType)}`
      )
        .then((r) => r.json())
        .then((d) => {
          setLocations(
            Array.isArray(d)
              ? d.map((loc: any) => ({
                  id: loc.id || loc._id,
                  name: loc.name,
                }))
              : []
          );
        })
        .catch(() => setLocations([]));
    } else {
      setLocations([]);
      setLocationId("");
    }
  }, [province, operationType]);

  // جلب نوع التسعير + سعر الوحدة/الإجمالي + السلفة
  useEffect(() => {
    // النجف: مقطوعة حسب الحمولة
    if (province && locationId && operationType && quantity && province === "النجف") {
      const q = Number(quantity);
      const row = najafPrices.find((n) => q >= n.minLoad && q <= n.maxLoad);
      if (row) {
        setPriceType("مقطوعة");
        setUnitRate(0);
        setTransferPrice(row.price);
        setAdvance(row.advance || 0);
        return;
      }
    }

    if (province && locationId && operationType) {
      fetch(
        `/api/transfer-prices?province=${encodeURIComponent(
          province
        )}&locationId=${encodeURIComponent(locationId)}&operationType=${encodeURIComponent(
          operationType
        )}`
      )
        .then((r) => r.json())
        .then((d: any[]) => {
          if (Array.isArray(d) && d.length) {
            const p = d[0];
            const pt = p.paymentType || ""; // "مقطوعة" | "باللتر" | "بالكغم"
            setPriceType(pt);
            if (pt === "باللتر" || pt === "بالكغم") {
              setUnitRate(Number(p.price || 0));
              setTransferPrice(0); // الإجمالي معلّق
              setAdvance(Number(p.advance || 0));
            } else {
              setUnitRate(0);
              setTransferPrice(Number(p.price || 0));
              setAdvance(Number(p.advance || 0));
            }
          } else {
            setPriceType("");
            setUnitRate(0);
            setTransferPrice(0);
            setAdvance(0);
          }
        })
        .catch(() => {
          setPriceType("");
          setUnitRate(0);
          setTransferPrice(0);
          setAdvance(0);
        });
    } else {
      setPriceType("");
      setUnitRate(0);
      setTransferPrice(0);
      setAdvance(0);
    }
  }, [province, locationId, operationType, quantity, najafPrices]);

  const getLabel = (o?: OptionT | null) => o?.name ?? "";

  /* ========== منطق الإضافات/الخصومات ========== */
  const openExtraDialog = (idx?: number) => {
    if (typeof idx === "number") {
      setEditingExtraIdx(idx);
      setExtraAmountInput(extraItems[idx].amount);
      setExtraDescInput(extraItems[idx].desc);
    } else {
      setEditingExtraIdx(null);
      setExtraAmountInput("");
      setExtraDescInput("");
    }
    setExtraDialogOpen(true);
  };
  const saveExtra = () => {
    if (!extraAmountInput.trim()) return;
    const newItem = { amount: extraAmountInput, desc: extraDescInput };
    if (editingExtraIdx !== null) {
      const arr = [...extraItems];
      arr[editingExtraIdx] = newItem;
      setExtraItems(arr);
    } else {
      setExtraItems([...extraItems, newItem]);
    }
    setExtraDialogOpen(false);
    setExtraAmountInput("");
    setExtraDescInput("");
    setEditingExtraIdx(null);
  };
  const deleteExtra = (idx: number) => {
    setExtraItems(extraItems.filter((_, i) => i !== idx));
  };

  const openDiscountDialog = (idx?: number) => {
    if (typeof idx === "number") {
      setEditingDiscountIdx(idx);
      setDiscountAmountInput(discountItems[idx].amount);
      setDiscountDescInput(discountItems[idx].desc);
    } else {
      setEditingDiscountIdx(null);
      setDiscountAmountInput("");
      setDiscountDescInput("");
    }
    setDiscountDialogOpen(true);
  };
  const saveDiscount = () => {
    if (!discountAmountInput.trim()) return;
    const newItem = { amount: discountAmountInput, desc: discountDescInput };
    if (editingDiscountIdx !== null) {
      const arr = [...discountItems];
      arr[editingDiscountIdx] = newItem;
      setDiscountItems(arr);
    } else {
      setDiscountItems([...discountItems, newItem]);
    }
    setDiscountDialogOpen(false);
    setDiscountAmountInput("");
    setDiscountDescInput("");
    setEditingDiscountIdx(null);
  };
  const deleteDiscount = (idx: number) => {
    setDiscountItems(discountItems.filter((_, i) => i !== idx));
  };

  const extraSum = extraItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const discountSum = discountItems.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalAdvance = advance + extraSum - discountSum;

  const isUnitBased = priceType === "باللتر" || priceType === "بالكغم";
  const shouldHideTotalNow = isUnitBased || (operationType === "تحميل" && priceType !== "مقطوعة");
  const remaining = isUnitBased ? 0 : transferPrice - advance;

  const handleSubmit = () => {
    if (
      !operationType ||
      !documentType ||
      !documentDate ||
      !documentLetter ||
      !documentNumber ||
      !vehicleId ||
      !driverId ||
      !province ||
      !locationId ||
      !productId ||
      !unit ||
      !quantity
    ) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setError("");
    setShowDialog(true);
  };

  const printApi = useReactToPrint({
    contentRef: printRef as MutableRefObject<HTMLElement | null>,
    documentTitle: `وصل_${receiptNumber}`,
    onAfterPrint: () => {
      setPrintData(null);
      setShowDialog(false);
      resetAll();
    },
  });

  const handleConfirmAndPrint = useCallback(async () => {
    try {
      const qrPayload = JSON.stringify({
        no: receiptNumber,
        dt: (documentDate as Date).toISOString(),
        op: operationType,
        doc: documentLetter + documentNumber,
        veh: vehicles.find((v) => v.id === vehicleId)?.name,
        drv: drivers.find((d) => d.id === driverId)?.name,
        prov: province,
        loc: locations.find((l) => l.id === locationId)?.name,
        qty: quantity,
        unit,
        prod: products.find((p) => p.id === productId)?.name,
        price: transferPrice,
        payType: priceType,
        unitRate,
        adv: advance,
        extra: extraItems.map((x) => x.amount).join("+"),
        disc: discountItems.map((x) => x.amount).join("+"),
      });

      // إنشاء المستند في الخادم
      const createRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationType, // "تحميل" | "تفريغ"
          documentType, // id
          letter: documentLetter,
          number: documentNumber,
          vehicleId,
          driverId,
          province,
          locationId,
          productId,
          unit,
          quantity: Number(quantity),
          addAmount: extraSum,
          addAmountDetail: extraItems.map((e) => e.desc).filter(Boolean).join(" | "),
          deductAmount: discountSum,
          deductAmountDetail: discountItems.map((d) => d.desc).filter(Boolean).join(" | "),
          total: priceType === "مقطوعة" ? transferPrice : 0,
          advance,
          paymentType: priceType,
          createdAt: (documentDate as Date).toISOString(),
          isUnloaded: false,
          unloadQuantity: null,
          unloadDate: null,
          qr: qrPayload,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        throw new Error(err?.error || "فشل إنشاء المستند في قاعدة البيانات");
      }

      // تجهيز بيانات الطباعة
      setPrintData({
        receiptNumber,
        documentDate: documentDate as Date,
        operationType,
        documentLetter,
        documentNumber,
        vehicle: vehicles.find((v) => v.id === vehicleId),
        driver: drivers.find((d) => d.id === driverId),
        province,
        location: locations.find((l) => l.id === locationId),
        product: products.find((p) => p.id === productId),
        unit,
        quantity,
        extraItems,
        discountItems,
        price: transferPrice,
        advance,
        totalAdvance,
        remaining,
        paymentType: priceType,
        unitRate,
      });

      setTimeout(() => printApi(), 200);
    } catch (error: any) {
      console.error("حدث خطأ أثناء حفظ المستند:", error);
      setError("حدث خطأ أثناء حفظ المستند: " + (error?.message || "غير معروف"));
    }
  }, [
    receiptNumber,
    documentDate,
    operationType,
    documentLetter,
    documentNumber,
    vehicles,
    vehicleId,
    drivers,
    driverId,
    province,
    locations,
    locationId,
    products,
    productId,
    unit,
    quantity,
    extraItems,
    discountItems,
    transferPrice,
    advance,
    totalAdvance,
    remaining,
    priceType,
    unitRate,
    printApi,
  ]);

  const resetAll = () => {
    setOperationType("");
    setDocumentType("");
    setDocumentDate(null);
    setDocumentLetter("");
    setDocumentNumber("");
    setVehicleId("");
    setDriverId("");
    setProvince("");
    setLocationId("");
    setProductId("");
    setUnit("");
    setQuantity("");
    setTransferPrice(0);
    setAdvance(0);
    setPriceType("");
    setUnitRate(0);
    setScannedImage("");
    setExtraItems([]);
    setDiscountItems([]);
  };

  /* ====================== واجهة المستخدم ====================== */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={arSA}>
      <Box
        sx={{
          px: 4,
          py: 4,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* العنوان */}
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h3" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
            نظام متابعة تحميل وتفريغ الحوضيات
          </Typography>
          <Typography variant="h6" color="text.secondary">
            إدخال المستندات وتصويرها
          </Typography>
          <Divider sx={{ width: "200px", mx: "auto", mt: 2 }} />
        </Box>

        {/* عمودان: (يسار) سكنر/رفع — (يمين) الإدخالات */}
        <Box sx={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
          {/* العمود الأيسر: السكنر + رفع محلي (ثلث) */}
          <Box
            sx={{
              width: "33.333%",
              minWidth: 320,
              maxWidth: "33.333%",
              pr: 1,
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <Card
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                position: "sticky",
                top: 20,
                minHeight: 420,
              }}
            >
              {/* مهم: عدم تمرير style لمكوّن ScannerHttp لأن Props لا تدعمه */}
              <ScannerHttp onScanned={setScannedImage} />

              <Stack direction="row" spacing={1} sx={{ mb: 2 }} justifyContent="center" flexWrap="wrap">
                <Button variant="outlined" onClick={() => scannerRef.current?.scan?.()}>
                  سحب من السكنر
                </Button>
                <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handlePickLocal}>
                  رفع صورة
                </Button>
                <Button variant="text" color="error" onClick={() => setScannedImage("")}>
                  مسح المعاينة
                </Button>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  ref={fileInputRef}
                  onChange={handleLocalFile}
                  style={{ display: "none" }}
                />
              </Stack>

              <Box
                sx={{
                  flex: 1,
                  bgcolor: "background.paper",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  p: 2,
                  pt: scannedImage ? 3 : 8,
                }}
              >
                {scannedImage ? (
                  <Box component="img" src={scannedImage} alt="معاينة المستند" sx={{ width: "100%", height: "auto" }} />
                ) : (
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      لا توجد صورة مسحوبة/مرفوعة بعد
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      استخدم “سحب من السكنر” أو “رفع صورة من الجهاز”
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Box>

          {/* العمود الأيمن: الإدخالات (ثلثان) */}
          <Box
            sx={{
              width: "66.667%",
              minWidth: 500,
              maxWidth: "66.667%",
              pl: 1,
              overflowY: "auto",
              flexShrink: 0,
            }}
          >
            <Card elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              {/* رأس قسم "بيانات المستند" */}
              <Box sx={{ position: "relative", mb: 2, display: "flex", alignItems: "center" }}>
                <Chip
                  label={`رقم الوصل: ${receiptNumber}`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <ReceiptIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
                  <Typography variant="h5" fontWeight="bold" display="inline">
                    بيانات المستند
                  </Typography>
                </Box>
              </Box>

              {/* نوع العملية */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  نوع العملية
                </Typography>
                <Box sx={{ textAlign: "center" }}>
                  <FormControl sx={{ width: 350, direction: "ltr", mx: "auto" }}>
                    <InputLabel id="op-label">نوع العملية</InputLabel>
                    <Select
                      labelId="op-label"
                      value={operationType}
                      label="نوع العملية"
                      onChange={(e) => setOperationType(e.target.value)}
                      MenuProps={{ PaperProps: { sx: { direction: "ltr", textAlign: "left" } } }}
                    >
                      <MenuItem value="تحميل">تحميل</MenuItem>
                      <MenuItem value="تفريغ">تفريغ</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Paper>

              {/* معلومات المستند */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  معلومات المستند
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  justifyContent="center"
                  alignItems="flex-start"
                  sx={{ flexWrap: "wrap", direction: "ltr" }}
                >
                  <Box sx={{ minWidth: 200, maxWidth: 220 }}>
                    <DatePicker
                      label="تاريخ المستند"
                      value={documentDate}
                      onChange={setDocumentDate}
                      format="dd/MM/yyyy"
                      maxDate={new Date()}
                      slots={{ openPickerIcon: CalendarTodayIcon }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: {
                            "& .MuiInputBase-input": { textAlign: "left" },
                            "& .MuiInputBase-root": { direction: "ltr", pr: "40px" },
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 160, maxWidth: 200 }}>
                    <TextField
                      fullWidth
                      label="رقم المستند"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value.replace(/\D/g, ""))}
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        maxLength: 8,
                        style: { direction: "ltr" },
                      }}
                      sx={{ direction: "rtl", "& input": { textAlign: "right" } }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 130, maxWidth: 160 }}>
                    <FormControl fullWidth sx={{ direction: "rtl" }}>
                      <InputLabel id="doc-letter-label">الحرف</InputLabel>
                      <Select
                        labelId="doc-letter-label"
                        value={documentLetter}
                        label="الحرف"
                        onChange={(e) => setDocumentLetter(e.target.value)}
                        MenuProps={{
                          PaperProps: { sx: { minWidth: 100, textAlign: "left", direction: "ltr" } },
                        }}
                      >
                        {ENGLISH_LETTERS.map((l) => (
                          <MenuItem key={l} value={l}>
                            {l}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ minWidth: 180, maxWidth: 220 }}>
                    <FormControl fullWidth sx={{ direction: "rtl" }}>
                      <InputLabel id="doc-type-label">نوع المستند</InputLabel>
                      <Select
                        labelId="doc-type-label"
                        value={documentType}
                        label="نوع المستند"
                        onChange={(e) => setDocumentType(e.target.value)}
                        MenuProps={{
                          PaperProps: { sx: { minWidth: 150, textAlign: "left", direction: "ltr" } },
                        }}
                      >
                        {documentTypes.map((dt) => (
                          <MenuItem key={dt.id} value={dt.id}>
                            {dt.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              </Paper>

              {/* السائق والمركبة */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  السائق والمركبة
                </Typography>

                <Stack
                  direction="row"
                  spacing={3}
                  justifyContent="center"
                  alignItems="stretch"
                  sx={{ flexWrap: "wrap", rowGap: 2 }}
                >
                  <Box sx={{ minWidth: 220, maxWidth: 260 }}>
                    <Autocomplete
                      options={vehicles}
                      getOptionLabel={(o) => o.name || ""}
                      value={vehicles.find((v) => v.id === vehicleId) || null}
                      onChange={(_, v) => setVehicleId(v?.id || "")}
                      renderInput={(params) => <TextField {...params} label="رقم المركبة" fullWidth />}
                      sx={{ direction: "ltr" }}
                      componentsProps={{ paper: { sx: { textAlign: "left", direction: "ltr" } } }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 280, maxWidth: 360 }}>
                    <Autocomplete
                      options={drivers}
                      getOptionLabel={(o) => o.name || ""}
                      value={drivers.find((d) => d.id === driverId) || null}
                      onChange={(_, d) => setDriverId(d?.id || "")}
                      renderInput={(params) => <TextField {...params} label="اسم السائق" fullWidth />}
                      sx={{ direction: "ltr" }}
                      componentsProps={{ paper: { sx: { textAlign: "left", direction: "ltr" } } }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* الوجهة */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  الوجهة
                </Typography>

                <Stack
                  direction="row"
                  spacing={3}
                  justifyContent="center"
                  alignItems="stretch"
                  sx={{ flexWrap: "wrap", rowGap: 2 }}
                >
                  <Box sx={{ minWidth: 240, maxWidth: 320 }}>
                    {/* ProvinceDropdown لا يدعم fullWidth → نتحكم بالعرض من هنا */}
                    <ProvinceDropdown value={province} onChange={setProvince} />
                  </Box>

                  <Box sx={{ minWidth: 300, maxWidth: 600 }}>
                    <Autocomplete
                      options={locations}
                      getOptionLabel={(o) => o.name || ""}
                      value={locations.find((l) => l.id === locationId) || null}
                      onChange={(_, l) => setLocationId(l?.id || "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            operationType === "تحميل"
                              ? "وجهة التفريغ"
                              : operationType === "تفريغ"
                              ? "وجهة التحميل"
                              : "الوجهة"
                          }
                          fullWidth
                        />
                      )}
                      disabled={!province || !operationType}
                      sx={{ direction: "ltr" }}
                      componentsProps={{ paper: { sx: { textAlign: "left", direction: "ltr" } } }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* المنتوج والقياس والكمية */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  المنتوج
                </Typography>

                <Stack
                  direction="row"
                  spacing={3}
                  justifyContent="center"
                  alignItems="stretch"
                  sx={{ flexWrap: "wrap", rowGap: 2 }}
                >
                  <Box sx={{ minWidth: 230, maxWidth: 300 }}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(o) => o.name || ""}
                      value={products.find((p) => p.id === productId) || null}
                      onChange={(_, p) => setProductId(p?.id || "")}
                      renderInput={(params) => <TextField {...params} label="المنتوج" fullWidth />}
                      sx={{ direction: "ltr" }}
                      componentsProps={{ paper: { sx: { textAlign: "left", direction: "ltr" } } }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 130, maxWidth: 160 }}>
                    <FormControl fullWidth sx={{ direction: "ltr" }}>
                      <InputLabel id="unit-label">وحدة القياس</InputLabel>
                      <Select
                        labelId="unit-label"
                        value={unit}
                        label="وحدة القياس"
                        onChange={(e) => setUnit(e.target.value)}
                        MenuProps={{ PaperProps: { sx: { textAlign: "left", direction: "ltr" } } }}
                      >
                        <MenuItem value="لتر">لتر</MenuItem>
                        <MenuItem value="كغم">كغم</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ minWidth: 130, maxWidth: 160 }}>
                    <TextField
                      fullWidth
                      label="الكمية"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: 6 }}
                      sx={{ direction: "ltr" }}
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* معلومات مالية */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" mb={2} color="primary" align="center">
                  معلومات مالية
                </Typography>

                {operationType === "تحميل" && (
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    <TextField
                      label="السلفة (ثلاث مراتب)"
                      value={advance3}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
                        setAdvance3(raw);
                        setAdvance(raw ? Number(raw) * 1000 : 0);
                      }}
                      placeholder="مثال: 450 → يُسجَّل 450,000"
                      helperText="اكتب 3 أرقام فقط، وسيتم إضافة ثلاثة أصفار تلقائيًا"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">دينار</InputAdornment>,
                        sx: { direction: "ltr" },
                      }}
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                        maxLength: 3,
                        style: { textAlign: "left" },
                      }}
                      sx={{ maxWidth: 240 }}
                    />
                  </Box>
                )}

                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2, flexWrap: "wrap" }}>
                  <Button variant="outlined" color="success" startIcon={<AddIcon />} onClick={() => openExtraDialog()}>
                    مبلغ مضاف
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<AddIcon />}
                    onClick={() => openDiscountDialog()}
                  >
                    خصم مبلغ
                  </Button>
                </Stack>

                {/* الإضافات */}
                {extraItems.length > 0 && (
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">المبلغ</TableCell>
                        <TableCell align="center">الوصف</TableCell>
                        <TableCell align="center">إجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {extraItems.map((x, i) => (
                        <TableRow key={i}>
                          <TableCell align="center">{Number(x.amount).toLocaleString()}</TableCell>
                          <TableCell align="center">{x.desc}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" onClick={() => openExtraDialog(i)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteExtra(i)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {/* الخصومات */}
                {discountItems.length > 0 && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">المبلغ</TableCell>
                        <TableCell align="center">الوصف</TableCell>
                        <TableCell align="center">إجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discountItems.map((x, i) => (
                        <TableRow key={i}>
                          <TableCell align="center">{Number(x.amount).toLocaleString()}</TableCell>
                          <TableCell align="center">{x.desc}</TableCell>
                          <TableCell align="center">
                            <IconButton color="primary" onClick={() => openDiscountDialog(i)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => deleteDiscount(i)}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Paper>

              {/* شريط الحالة والأزرار */}
              <Paper elevation={1} sx={{ p: 3, borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: "wrap" }}>
                  {/* اليسار: Chips للمعلومات المالية */}
                  <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {shouldHideTotalNow ? (
                        isUnitBased ? (
                          <>
                            <Chip
                              label={`سعر ${priceType === "باللتر" ? "اللتر" : "الكغم"}: ${unitRate.toLocaleString()}`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip label="الإجمالي: معلّق حتى التفريغ" color="warning" variant="outlined" />
                          </>
                        ) : null
                      ) : (
                        <Chip
                          label={`سعر النقلة: ${transferPrice.toLocaleString()}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      <Chip label={`السلفة: ${advance.toLocaleString()}`} color="secondary" variant="outlined" />
                      <Chip label={`مبالغ إضافية: ${extraSum.toLocaleString()}`} color="success" variant="outlined" />
                      <Chip label={`خصومات: ${discountSum.toLocaleString()}`} color="error" variant="outlined" />
                    </Stack>
                  </Box>

                  {/* الوسط: خطأ إن وجد */}
                  <Box sx={{ minWidth: 200 }}>{error && <Alert severity="error">{error}</Alert>}</Box>

                  {/* اليمين: أزرار */}
                  <Box sx={{ minWidth: 220, textAlign: "left" }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton onClick={resetAll} color="primary">
                        <RefreshIcon />
                      </IconButton>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleSubmit}
                        endIcon={<PrintIcon />}
                        disabled={!scannedImage}
                      >
                        إدخال وطباعة
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Card>
          </Box>
        </Box>

        {/* تأكيد قبل الطباعة */}
        <Dialog open={showDialog} onClose={() => setShowDialog(false)} fullWidth maxWidth="md">
          <DialogTitle align="center">تأكيد بيانات المستند</DialogTitle>
          <DialogContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    نوع العملية
                  </TableCell>
                  <TableCell align="right">{operationType}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    رقم المستند
                  </TableCell>
                  <TableCell align="right">
                    {documentLetter}
                    {documentNumber}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    تاريخ المستند
                  </TableCell>
                  <TableCell align="right">{documentDate?.toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    رقم المركبة
                  </TableCell>
                  <TableCell align="right">{getLabel(vehicles.find((v) => v.id === vehicleId))}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    اسم السائق
                  </TableCell>
                  <TableCell align="right">{getLabel(drivers.find((d) => d.id === driverId))}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    المحافظة
                  </TableCell>
                  <TableCell align="right">{province}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    الوجهة
                  </TableCell>
                  <TableCell align="right">{getLabel(locations.find((l) => l.id === locationId))}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    المنتوج
                  </TableCell>
                  <TableCell align="right">{getLabel(products.find((p) => p.id === productId))}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    الكمية
                  </TableCell>
                  <TableCell align="right">
                    {quantity} {unit}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    سعر النقلة
                  </TableCell>
                  <TableCell align="right">
                    {isUnitBased
                      ? `معلّق (سعر ${priceType === "باللتر" ? "اللتر" : "الكغم"}: ${unitRate.toLocaleString()})`
                      : priceType === "مقطوعة"
                      ? transferPrice.toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button variant="contained" onClick={handleConfirmAndPrint}>
              طباعة
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog المبلغ المضاف */}
        <Dialog open={extraDialogOpen} onClose={() => setExtraDialogOpen(false)}>
          <DialogTitle>{editingExtraIdx !== null ? "تعديل مبلغ مضاف" : "إضافة مبلغ مضاف"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="المبلغ المضاف"
              fullWidth
              value={extraAmountInput}
              onChange={(e) => setExtraAmountInput(e.target.value.replace(/\D/g, ""))}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="الوصف"
              fullWidth
              value={extraDescInput}
              onChange={(e) => setExtraDescInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExtraDialogOpen(false)}>إلغاء</Button>
            <Button variant="contained" onClick={saveExtra}>
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog الخصم */}
        <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)}>
          <DialogTitle>{editingDiscountIdx !== null ? "تعديل خصم مبلغ" : "إضافة خصم مبلغ"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="قيمة الخصم"
              fullWidth
              value={discountAmountInput}
              onChange={(e) => setDiscountAmountInput(e.target.value.replace(/\D/g, ""))}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="الوصف"
              fullWidth
              value={discountDescInput}
              onChange={(e) => setDiscountDescInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiscountDialogOpen(false)}>إلغاء</Button>
            <Button variant="contained" onClick={saveDiscount}>
              حفظ
            </Button>
          </DialogActions>
        </Dialog>

        {/* عنصر الطباعة المخفي */}
        <div style={{ position: "absolute", top: -9999, left: -9999 }}>
          <PrintReceipt ref={printRef} data={printData} />
        </div>
      </Box>
    </LocalizationProvider>
  );
}
