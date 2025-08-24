// src/pages/TelegramsPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Button,
  Typography,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  TextField,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import * as XLSX from "xlsx";

type Driver = {
  id: string;
  first: string;
  father: string;
  grandfather: string;
  fourth: string;
  last: string;
  fullName: string;
  motherFirst?: string;
  motherFather?: string;
  motherGrandfather?: string;
  nationalId?: string;
  birthDate?: string;
  province?: string;
  areaAddress?: string;
};

type Vehicle = {
  id: string;
  number: string;
  province?: string;
  wheelType?: string;
  ownerName?: string;
};

type TelegramRow = {
  first: string;
  father: string;
  grandfather: string;
  fourth: string;
  last: string;
  motherTriple: string;
  nationalId: string;
  birthDate: string;
  driverProvince: string;
  address: string;              // ✅ لا تنسَ العنوان
  vehicleNumber: string;
  vehicleProvince: string;
  wheelType: string;
  ownerName: string;
};

// إن حبيت واجهة معكوسة خله true
const REVERSED_UI = true;
// ثبّت المنفذ للسيرفر
const BASE_API = "http://localhost:5000";

export default function TelegramsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [rows, setRows] = useState<TelegramRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_API}/api/drivers`)
      .then((r) => r.json())
      .then((arr) => {
        const mapped: Driver[] = Array.isArray(arr)
          ? arr.map((d: any) => ({
              id: d.id || d._id,
              first: d.first,
              father: d.father,
              grandfather: d.grandfather,
              fourth: d.fourth,
              last: d.last,
              fullName:
                d.fullName ||
                [d.first, d.father, d.grandfather, d.fourth, d.last]
                  .filter(Boolean)
                  .join(" "),
              motherFirst: d.motherFirst || "",
              motherFather: d.motherFather || "",
              motherGrandfather: d.motherGrandfather || "",
              nationalId: d.nationalId || "",
              birthDate: d.birthDate || "",
              province: d.province || "",
              areaAddress: d.areaAddress || "",
            }))
          : [];
        setDrivers(mapped);
      })
      .catch(() => setDrivers([]));

    fetch(`${BASE_API}/api/vehicles`)
      .then((r) => r.json())
      .then((arr) => {
        const mapped: Vehicle[] = Array.isArray(arr)
          ? arr.map((v: any) => ({
              id: v.id || v._id,
              number: v.number,
              province: v.province || "",
              wheelType: v.wheelType || v.type || "",
              ownerName: v.ownerName || "",
            }))
          : [];
        setVehicles(mapped);
      })
      .catch(() => setVehicles([]));
  }, []);

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === driverId),
    [drivers, driverId]
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );

  const addRow = () => {
    setError("");
    if (!selectedDriver || !selectedVehicle) {
      setError("اختر اسم السائق ورقم المركبة أولاً");
      return;
    }
    const motherTriple = [
      selectedDriver.motherFirst,
      selectedDriver.motherFather,
      selectedDriver.motherGrandfather,
    ]
      .filter(Boolean)
      .join(" ");

    setRows((r) => [
      ...r,
      {
        first: selectedDriver.first || "",
        father: selectedDriver.father || "",
        grandfather: selectedDriver.grandfather || "",
        fourth: selectedDriver.fourth || "",
        last: selectedDriver.last || "",
        motherTriple,
        nationalId: selectedDriver.nationalId || "",
        birthDate: selectedDriver.birthDate || "",
        driverProvince: selectedDriver.province || "",
        address: selectedDriver.areaAddress || "",
        vehicleNumber: selectedVehicle.number || "",
        vehicleProvince: selectedVehicle.province || "",
        wheelType: selectedVehicle.wheelType || "",
        ownerName: selectedVehicle.ownerName || "",
      },
    ]);
  };

  const handleExportExcel = () => {
    setError("");
    if (rows.length === 0) {
      setError("لا توجد بيانات لحفظها");
      return;
    }
    const sheetData = rows.map((r, i) => ({
      تسلسل: i + 1,
      الاسم: r.first,
      الأب: r.father,
      الجد: r.grandfather,
      الرابع: r.fourth,
      اللقب: r.last,
      "اسم الأم الثلاثي": r.motherTriple,
      "رقم البطاقة الوطنية": r.nationalId,
      "تاريخ الولادة": r.birthDate,
      "محافظة السائق": r.driverProvince,
      العنوان: r.address,
      "رقم المركبة": r.vehicleNumber,
      "محافظة المركبة": r.vehicleProvince,
      "نوع العجلة": r.wheelType,
      "اسم المالك": r.ownerName,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      REVERSED_UI ? sheetData.map((o) => Object.fromEntries(Object.entries(o).reverse())) : sheetData
    );
    XLSX.utils.book_append_sheet(wb, ws, "البرقيات");
    XLSX.writeFile(wb, `البرقيات_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // يدعم الحالتين: JSON (رابط) أو ملف مباشر
  const handleExportAccess = async () => {
    setError("");
    if (rows.length === 0) {
      setError("لا توجد بيانات لحفظها");
      return;
    }
    try {
      const res = await fetch(`${BASE_API}/api/telegrams-access/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: `telegrams_${new Date().toISOString().slice(0, 10)}.accdb`,
        }),
      });

      const ct = res.headers.get("content-type") || "";

      if (!res.ok) {
        // حاول قراءة رسالة الخطأ
        if (ct.includes("application/json")) {
          const j = await res.json();
          setError(`فشل إنشاء ملف Access. ${j?.error || ""}`);
        } else {
          setError("فشل إنشاء ملف Access.");
        }
        return;
      }

      if (ct.includes("application/json")) {
        // وضع الاحتفاظ: نحصل على downloadUrl
        const j = await res.json();
        if (j?.downloadUrl) {
          const url = `${BASE_API}${j.downloadUrl}`;
          window.open(url, "_blank");
        } else {
          setError("تم إنشاء الملف لكن لم يصل رابط التحميل.");
        }
      } else {
        // تنزيل مباشر (ملف)
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `telegrams_${new Date().toISOString().slice(0, 10)}.accdb`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      setError(`تعذر الاتصال بالسيرفر: ${e?.message || e}`);
    }
  };

  const controls = [
    <Autocomplete
      key="driver"
      options={drivers}
      getOptionLabel={(o) => o.fullName || ""}
      value={selectedDriver || null}
      onChange={(_, v) => setDriverId(v?.id || "")}
      renderInput={(params) => <TextField {...params} label="اسم السائق" />}
      sx={{ width: { xs: 260, sm: 320 } }}
      isOptionEqualToValue={(o, v) => o.id === v.id}
    />,
    <Autocomplete
      key="vehicle"
      options={vehicles}
      getOptionLabel={(o) => o.number || ""}
      value={selectedVehicle || null}
      onChange={(_, v) => setVehicleId(v?.id || "")}
      renderInput={(params) => <TextField {...params} label="رقم المركبة" />}
      sx={{ width: { xs: 200, sm: 240 } }}
      isOptionEqualToValue={(o, v) => o.id === v.id}
    />,
    <Button
      key="add"
      variant="contained"
      color="success"
      startIcon={<AddIcon />}
      onClick={addRow}
      disabled={!driverId || !vehicleId}
      sx={{ minWidth: 140, fontWeight: 700, height: 48 }}
    >
      إضافة
    </Button>,
    <Button
      key="excel"
      variant="outlined"
      startIcon={<SaveAltIcon />}
      onClick={handleExportExcel}
      sx={{ minWidth: 160, fontWeight: 700, height: 48 }}
    >
      حفظ Excel
    </Button>,
    <Button
      key="access"
      variant="outlined"
      startIcon={<SaveAltIcon />}
      onClick={handleExportAccess}
      sx={{ minWidth: 180, fontWeight: 700, height: 48 }}
    >
      حفظ Access
    </Button>,
  ];

  const renderedControls = REVERSED_UI ? [...controls].reverse() : controls;

  const baseColumns: { key: string; label: string }[] = [
    { key: "seq", label: "تسلسل" },
    { key: "first", label: "الاسم" },
    { key: "father", label: "الأب" },
    { key: "grandfather", label: "الجد" },
    { key: "fourth", label: "الرابع" },
    { key: "last", label: "اللقب" },
    { key: "motherTriple", label: "اسم الأم الثلاثي" },
    { key: "nationalId", label: "رقم البطاقة الوطنية" },
    { key: "birthDate", label: "تاريخ الولادة" },
    { key: "driverProvince", label: "محافظة السائق" },
    { key: "address", label: "العنوان" },
    { key: "vehicleNumber", label: "رقم المركبة" },
    { key: "vehicleProvince", label: "محافظة المركبة" },
    { key: "wheelType", label: "نوع العجلة" },
    { key: "ownerName", label: "اسم المالك" },
  ];
  const columns = REVERSED_UI ? [...baseColumns].reverse() : baseColumns;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, direction: "rtl", fontFamily: "Cairo, Arial, Tahoma, sans-serif" }}>
      <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 3 }}>
        البرقيات
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            useFlexGap
            flexWrap="wrap"
            sx={{ maxWidth: "100%" }}
          >
            {renderedControls}
          </Stack>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ p: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} align="center">{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  لا توجد بيانات — أضف سطرًا من الأعلى
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.key} align="center">
                      {c.key === "seq" ? i + 1 : (r as any)[c.key] || "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
