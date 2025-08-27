// src/components/ProvinceDropdown.tsx
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";

export const PROVINCES = [
  "بغداد",
  "نينوى",
  "البصرة",
  "الأنبار",
  "ذي قار",
  "السليمانية",
  "القادسية",
  "صلاح الدين",
  "النجف",
  "كركوك",
  "ديالى",
  "المثنى",
  "ميسان",
  "واسط",
  "أربيل",
  "بابل",
  "دهوك",
] as const;

type ProvinceDropdownProps = {
  value: string;
  onChange: (val: string) => void;
  sx?: SxProps<Theme>;
  tabIndex?: number;
  /** عند true سيضاف عنصر "كل المحافظات" في بداية القائمة (مفيد للبحث) */
  showAllOption?: boolean;
  /** تسمية الحقل (label)؛ افتراضي "المحافظة" */
  label?: string;
};

export default function ProvinceDropdown({
  value,
  onChange,
  sx = {},
  tabIndex = 0,
  showAllOption = false,
  label = "المحافظة",
}: ProvinceDropdownProps) {
  const options = showAllOption
    ? (["كل المحافظات", ...PROVINCES] as string[])
    : ([...PROVINCES] as string[]);

  return (
    <Autocomplete<string, false, false, false>
      options={options}
      value={value || (showAllOption ? "كل المحافظات" : "")}
      onChange={(_, newValue) => onChange(newValue ?? "")}
      getOptionLabel={(option) => option}
      isOptionEqualToValue={(opt, val) => opt === val}
      sx={{
        minWidth: 180,
        direction: "rtl",
        ...sx,
      }}
      slotProps={{
        paper: { sx: { direction: "rtl" } },
        popper: { sx: { direction: "rtl" } },
      }}
      ListboxProps={{
        sx: { direction: "rtl", textAlign: "right" },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          inputProps={{
            ...params.inputProps,
            style: { textAlign: "right", direction: "rtl" },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ direction: "rtl", textAlign: "right" }}>
          {option}
        </Box>
      )}
      tabIndex={tabIndex}
    />
  );
}
