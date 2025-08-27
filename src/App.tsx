// src/App.tsx
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import ContractorsPage from "./pages/ContractorsPage";
import VehiclePage from "./pages/VehiclePage";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme/theme";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { Routes, Route } from "react-router-dom"; // ⬅️ أزل BrowserRouter من هنا
// @ts-ignore
import stylisRTLPlugin from "stylis-plugin-rtl";
import { ar } from "date-fns/locale";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import DriversPage from "./pages/DriversPage";
import ProductsPage from "./pages/ProductsPage";
import LocationsPage from "./pages/LocationsPage";
import DocumentTypesPage from "./pages/DocumentTypesPage";
import BalancePage from "./pages/GeneralBalancePage";
import SafePage from "./pages/CashBoxPage";
import TransferPricesPage from "./pages/TransferPricesPage";
import DocumentsEntryPage from "./pages/DocumentsEntryPage";
import TelegramsPage from "./pages/TelegramsPage";
import UnloadingRegisterPage from "./pages/UnloadingRegisterPage";
import UsersPage from "./pages/UsersPage";

const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [stylisRTLPlugin],
});

const App: React.FC = () => (
  <CacheProvider value={rtlCache}>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ar}>
        <AppShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contractors" element={<ContractorsPage />} />
            <Route path="/vehicles" element={<VehiclePage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/document-types" element={<DocumentTypesPage />} />
            <Route path="/balance" element={<BalancePage />} />
            <Route path="/safe" element={<SafePage />} />
            <Route path="/transfer-prices" element={<TransferPricesPage />} />
            <Route path="/documents-entry" element={<DocumentsEntryPage />} />
            <Route path="/telegrams" element={<TelegramsPage />} />
            <Route path="/unloading-register" element={<UnloadingRegisterPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Routes>
        </AppShell>
      </LocalizationProvider>
    </ThemeProvider>
  </CacheProvider>
);

export default App;
