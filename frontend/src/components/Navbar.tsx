import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";

type NavbarProps = { onMenuClick: () => void; open: boolean; drawerWidth: number };

const TRANS_MS = 280;

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, open, drawerWidth }) => (
  <AppBar
    position="fixed"
    sx={(theme) => ({
      bgcolor: "#1976d2",
      direction: "rtl",
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["margin", "width"], {
        duration: TRANS_MS,
        easing: theme.transitions.easing.easeInOut,
      }),
      ml: open ? `${drawerWidth}px` : 0,
      width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
      willChange: "margin-left,width",
    })}
  >
    <Toolbar>
      <div style={{ flexGrow: 1 }} />
      <Typography variant="h6" component="div" sx={{ fontWeight: "bold", textAlign: "left", mx: 1 }}>
        نظام إدارة المستندات
      </Typography>
      <IconButton edge="end" color="inherit" aria-label="menu" sx={{ ml: 1 }} onClick={onMenuClick}>
        <MenuIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
);

export default Navbar;
