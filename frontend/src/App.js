import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MemoraProvider } from "./context/MemoraContext";
import LandingPage from "./pages/LandingPage";
import NameEntryPage from "./pages/NameEntryPage";
import PhotoCapturePage from "./pages/PhotoCapturePage";
import MessagePage from "./pages/MessagePage";
import FinalMemoryPage from "./pages/FinalMemoryPage";
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
            <Route path="/message" element={<MessagePage />} />
            <Route path="/memory" element={<FinalMemoryPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </MemoraProvider>
  );
}

export default App;
