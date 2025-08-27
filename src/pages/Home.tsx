import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import axios from "axios";

const { data } = await axios.get('/health');

const Home: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" align="right" gutterBottom>
      مرحبًا بك في نظام إدارة المستندات!
    </Typography>
  </Box>
);

export default Home;
