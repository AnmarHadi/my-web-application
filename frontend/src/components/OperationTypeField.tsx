// src/components/OperationTypeField.tsx
import { TextField, MenuItem } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type OperationTypeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  sx?: SxProps<Theme>;
};

export default function OperationTypeField({
  value,
  onChange,
  label = "نوع العملية",
  sx,
}: OperationTypeFieldProps) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      sx={{
        width: 220,
        mb: 2,
        direction: "ltr",
        "& .MuiSelect-select": { textAlign: "left", direction: "ltr" },
        ...sx,
      }}
      SelectProps={{
        MenuProps: {
          PaperProps: { sx: { direction: "ltr", textAlign: "left" } },
        },
      }}
      InputLabelProps={{
        sx: { left: 2, right: "unset", textAlign: "left", direction: "ltr" },
      }}
    >
      <MenuItem value="تحميل" sx={{ textAlign: "left", direction: "ltr" }}>
        تحميل
      </MenuItem>
      <MenuItem value="تفريغ" sx={{ textAlign: "left", direction: "ltr" }}>
        تفريغ
      </MenuItem>
    </TextField>
  );
}
