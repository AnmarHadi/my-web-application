import React, { useState } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const drawerWidth = 240;
const TRANS_MS = 280;

type AppShellProps = { children: ReactNode };

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleMenuClick = () => setSidebarOpen((p) => !p);

  return (
    <Box sx={{ display: "flex", direction: "rtl", background: "#fff", minHeight: "100vh" }}>
      <CssBaseline />
      <Navbar onMenuClick={handleMenuClick} open={sidebarOpen} drawerWidth={drawerWidth} />
      <Sidebar open={sidebarOpen} drawerWidth={drawerWidth} />
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          pt: 8,
          direction: "rtl",
          minHeight: "100vh",
          background: "#fff",
          transition: theme.transitions.create("margin", {
            duration: TRANS_MS,
            easing: theme.transitions.easing.easeInOut,
          }),
          ml: sidebarOpen ? `${drawerWidth}px` : 0,
          willChange: "margin-left",
        })}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
