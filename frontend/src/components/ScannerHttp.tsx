// src/components/ScannerHttp.tsx
import { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

interface Props {
  onScanned: (base64: string) => void;
}

export default function ScannerHttp({ onScanned }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/scan", { method: "POST" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      onScanned(base64); // نمرر الصورة base64 للصفحة الأم فقط
    } catch (e: any) {
      setError(e?.message || "فشل المسح");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ textAlign: "right" }}>
      <Button
        variant="outlined"
        onClick={handleScan}
        disabled={loading}
        fullWidth
        sx={{
          mb: 1,
          backgroundColor: "#0dbb38", // أخضر ساطع
          color: "#fff",
          "&:hover": { backgroundColor: "#06962d" },
        }}
      >
        {loading ? <CircularProgress size={22} /> : "Scan المستند"}
      </Button>

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

// تحويل Blob إلى base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject("تحويل Base64 فشل");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
