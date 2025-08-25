// src/components/Sidebar.tsx
import React, { useEffect, useState } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import BusinessIcon from "@mui/icons-material/Business";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PlaceIcon from "@mui/icons-material/Place";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

type SidebarProps = { open: boolean; drawerWidth: number };

const APPBAR_HEIGHT = 64;
const TRANS_MS = 280;

const menuItems = [
  { text: "الرئيسية", icon: <HomeIcon />, path: "/" },
  { text: "المتعهدين", icon: <BusinessIcon />, path: "/contractors" },
  { text: "المركبات", icon: <DirectionsCarIcon />, path: "/vehicles" },
  { text: "السائقين", icon: <PersonIcon />, path: "/drivers" },
  { text: "المنتجات", icon: <Inventory2Icon />, path: "/products" },
  { text: "وجهات التحميل والتفريغ", icon: <PlaceIcon />, path: "/locations" },
  { text: "نوع المستند", icon: <DescriptionIcon />, path: "/document-types" },
  { text: "إدخال المستندات", icon: <DescriptionIcon />, path: "/documents-entry" },
  { text: "البرقيات", icon: <DescriptionIcon />, path: "/telegrams" },
  { text: "تسجيل التفريغ", icon: <DescriptionIcon />, path: "/unloading-register" },
];

const financeMenu = [
  { text: "الرصيد", path: "/balance", icon: <AccountBalanceIcon /> },
  { text: "القاصة", path: "/safe", icon: <AccountBalanceWalletIcon /> },
  { text: "اسعار النقلات", path: "/transfer-prices", icon: <LocalShippingIcon /> },
];

const Sidebar: React.FC<SidebarProps> = ({ open, drawerWidth }) => {
  const location = useLocation();
  const [financeOpen, setFinanceOpen] = useState(false);

  // ===== اسم المستخدم المعروض أعلى السايدبار =====
  const [username, setUsername] = useState<string>(
    () => localStorage.getItem("currentUserName") || "مستخدم"
  );

  // تحدّث الاسم إذا تغيّر في localStorage من تبويب آخر
  useEffect(() => {
    const onStorage = () => {
      setUsername(localStorage.getItem("currentUserName") || "مستخدم");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // في حال أردت تحديثه عند كل فتح للسايدبار (مثلاً إذا تغيّر أثناء الجلسة نفسها):
  useEffect(() => {
    if (open) {
      setUsername(localStorage.getItem("currentUserName") || "مستخدم");
    }
  }, [open]);

  return (
    <Drawer
      variant="persistent"
      anchor="left" // السايدبار على اليسار
      open={open}
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiDrawer-paper": (theme) => ({
          width: open ? drawerWidth : 0,
          transition: theme.transitions.create("width", {
            duration: TRANS_MS,
            easing: theme.transitions.easing.easeInOut,
          }),
          position: "fixed",
          top: APPBAR_HEIGHT,
          bottom: 0,
          left: 0,
          right: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
          direction: "rtl",
          borderRight: "1px solid rgba(0,0,0,0.12)",
          pointerEvents: open ? "auto" : "none",
        }),
      }}
    >
      {/* رأس يحتوي اسم المستخدم */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          direction: "ltr", // لإبقاء الأيقونة والنص بمحاذاة اليسار
        }}
      >
        <Avatar sx={{ bgcolor: "primary.main" }}>
          {(username?.[0] || "م").toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            title={username}
          >
            {username}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "left" }}>
            أهلاً بك 👋
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                direction: "ltr",
                justifyContent: "flex-start",
                pl: 2,
                gap: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  sx: { textAlign: "left", width: "100%" },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* المالية والحسابات */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setFinanceOpen((prev) => !prev)}
            selected={
              location.pathname.startsWith("/balance") ||
              location.pathname.startsWith("/safe") ||
              location.pathname.startsWith("/transfer-prices")
            }
            sx={{
              direction: "ltr",
              justifyContent: "flex-start",
              pl: 2,
              gap: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AccountBalanceIcon />
            </ListItemIcon>

            <ListItemText
              primary="المالية والحسابات"
              primaryTypographyProps={{ sx: { textAlign: "left", width: "100%" } }}
            />

            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
              {financeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </span>
          </ListItemButton>
        </ListItem>

        {financeOpen &&
          financeMenu.map((item) => (
            <ListItem
              key={item.text}
              disablePadding
              sx={{
                pl: 3,
                background: location.pathname === item.path ? "#e8f5e9" : "transparent",
              }}
            >
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{ direction: "ltr", justifyContent: "flex-start", pl: 3 }}
                selected={location.pathname === item.path}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ sx: { textAlign: "left", width: "100%" } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
