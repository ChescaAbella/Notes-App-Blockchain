import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landingPage";
import Header from "./components/header";
import { BlockchainProvider } from "./context/BlockchainProvider";
import { WalletProvider } from "./context/WalletContext";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <WalletProvider>
      <BlockchainProvider>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<HomePage />} />

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </BlockchainProvider>
    </WalletProvider>
  );
}
