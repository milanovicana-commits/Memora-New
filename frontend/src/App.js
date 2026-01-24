import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MemoraProvider } from "./context/MemoraContext";
import LandingPage from "./pages/LandingPage";
import NameEntryPage from "./pages/NameEntryPage";
import PhotoCapturePage from "./pages/PhotoCapturePage";
import ToneSelectionPage from "./pages/ToneSelectionPage";
import MessagePage from "./pages/MessagePage";
import FinalMemoryPage from "./pages/FinalMemoryPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <MemoraProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/name" element={<NameEntryPage />} />
            <Route path="/capture" element={<PhotoCapturePage />} />
            <Route path="/tone" element={<ToneSelectionPage />} />
            <Route path="/message" element={<MessagePage />} />
            <Route path="/memory" element={<FinalMemoryPage />} />
            <Route path="/thankyou" element={<ThankYouPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </MemoraProvider>
  );
}

export default App;
