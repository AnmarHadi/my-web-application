// src/components/PrintReceipt.tsx
import { forwardRef } from "react";
import QRCode from "react-qr-code";
import { Box, Typography, Table, TableBody, TableRow, TableCell } from "@mui/material";

// يجب تمرير كل بيانات الوصل عبر props
type Props = {
  operationType: string;
  documentLetter: string;
  documentNumber: string;
  vehicleName: string;
  driverName: string;
  province: string;
  locationName: string;
  quantity: string;
  unit: string;
  extraAmount: string;
  extraDesc: string;
  discountAmount: string;
  discountDesc: string;
  transferPrice: number;
  advance: number;
  netPaid: number;
  qrData: string; // يجب تجهيزها مسبقًا في الصفحة الرئيسية
};

const PrintReceipt = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const {
    operationType, documentLetter, documentNumber, vehicleName, driverName,
    province, locationName, quantity, unit, extraAmount, extraDesc,
    discountAmount, discountDesc, transferPrice, advance, netPaid, qrData
  } = props;

  return (
    <Box
      ref={ref}
      sx={{
        width: 410,
        p: 2,
        textAlign: "center",
        fontFamily: "Cairo, Tahoma, Arial, sans-serif"
      }}
    >
      <Typography variant="h5" fontWeight={800} mb={2} align="center">
        طباعة وصل مستند {operationType}
      </Typography>

      <Table sx={{ mx: "auto", mb: 2, minWidth: 360, border: "1px solid #bbb" }}>
        <TableBody>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 700 }}>نوع العملية</TableCell>
            <TableCell align="center">{operationType}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>رقم المستند</TableCell>
            <TableCell align="center">{documentLetter}{documentNumber}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 700 }}>رقم المركبة</TableCell>
            <TableCell align="center">{vehicleName}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>اسم السائق</TableCell>
            <TableCell align="center">{driverName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 700 }}>المحافظة</TableCell>
            <TableCell align="center">{province}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              {operationType === "تحميل" ? "وجهة التحميل" : "وجهة التفريغ"}
            </TableCell>
            <TableCell align="center">{locationName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 700 }}>
              {operationType === "تحميل" ? "الكمية المحملة" : "الكمية المفرغة"}
            </TableCell>
            <TableCell align="center">{quantity} {unit}</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>سعر النقلة</TableCell>
            <TableCell align="center">{transferPrice.toLocaleString()} دينار</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 700 }}>السلفة</TableCell>
            <TableCell align="center">{advance.toLocaleString()} دينار</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>صافي المسلم</TableCell>
            <TableCell align="center" sx={{ fontWeight: 900, color: "#6113B2" }}>
              {netPaid.toLocaleString()} دينار
            </TableCell>
          </TableRow>
          {(extraAmount && extraDesc) && (
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>المبلغ المضاف</TableCell>
              <TableCell align="center" colSpan={3}>
                {extraAmount} - {extraDesc}
              </TableCell>
            </TableRow>
          )}
          {(discountAmount && discountDesc) && (
            <TableRow>
              <TableCell align="center" sx={{ fontWeight: 700 }}>المبلغ المخصوم</TableCell>
              <TableCell align="center" colSpan={3}>
                {discountAmount} - {discountDesc}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Box sx={{ my: 3, display: "flex", justifyContent: "center" }}>
        <QRCode value={qrData} size={120} />
      </Box>
    </Box>
  );
});

PrintReceipt.displayName = "PrintReceipt";

export default PrintReceipt;
