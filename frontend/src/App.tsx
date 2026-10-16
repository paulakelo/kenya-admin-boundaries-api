import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./views/LandingPage";
import ApiDocs from "./views/ApiDocs";
import Playground from "./views/Playground";
import { Github } from "lucide-react";
import "./index.css";

function NavigationHeader() {
  return (
    <header className="h-12 border-b border-white/10 bg-[#0D0E15]/90 backdrop-blur-md flex items-center justify-end px-6 z-50 shrink-0">
      <a
        href="https://github.com/paulakelo/kenya-admin-boundaries-api"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8B94A5] hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5"
        title="GitHub Repository"
      >
        <Github className="h-4 w-4" />
      </a>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0E15] text-[#F4F5F6] font-sans">
        <NavigationHeader />
        <div className="flex-1 min-h-0 h-full relative overflow-hidden">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="/map" element={<Playground />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
