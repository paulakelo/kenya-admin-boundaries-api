import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import LandingPage from "./views/LandingPage";
import ApiDocs from "./views/ApiDocs";
import Playground from "./views/Playground";
import { Terminal, BookOpen, Map, Github, Activity } from "lucide-react";
import "./index.css";

function NavigationHeader() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <header className="h-14 border-b border-white/10 bg-[#0D0E15]/90 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0 font-mono">
      {/* Brand & System Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded bg-[#D1FF00] flex items-center justify-center text-[#0D0E15] font-black text-xs font-mono">
            NX
          </div>
          <div>
            <div className="font-bold text-xs tracking-wider text-white group-hover:text-[#D1FF00] transition-colors flex items-center gap-1.5">
              <span>KENYA ADMIN BOUNDARIES</span>
              <span className="text-[#D1FF00]">// API</span>
            </div>
            <div className="text-[10px] text-[#8B94A5] tracking-tight">
              PRECISION GEOSPATIAL ENGINE
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Switcher Tabs */}
      <nav className="flex items-center gap-1 bg-[#141724] p-1 rounded-lg border border-white/10">
        <Link
          to="/"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            path === "/"
              ? "bg-[#D1FF00] text-[#0D0E15] shadow-xs"
              : "text-[#8B94A5] hover:text-white hover:bg-white/5"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Overview</span>
        </Link>
        <Link
          to="/docs"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            path.startsWith("/docs")
              ? "bg-[#D1FF00] text-[#0D0E15] shadow-xs"
              : "text-[#8B94A5] hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>API Docs & Console</span>
        </Link>
        <Link
          to="/map"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            path.startsWith("/map")
              ? "bg-[#D1FF00] text-[#0D0E15] shadow-xs"
              : "text-[#8B94A5] hover:text-white hover:bg-white/5"
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span>Map Explorer</span>
        </Link>
      </nav>

      {/* Right side utilities */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-[#D1FF00] bg-[#D1FF00]/10 border border-[#D1FF00]/25 px-2.5 py-1 rounded-full">
          <Activity className="h-3 w-3 animate-pulse text-[#D1FF00]" />
          <span>SYS_STATUS: ONLINE</span>
        </div>

        <a
          href="https://github.com/paulakelo/kenya-admin-boundaries-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8B94A5] hover:text-white transition-colors p-1"
          title="GitHub Repository"
        >
          <Github className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0D0E15] text-[#F4F5F6] font-sans">
        <NavigationHeader />
        <div className="flex-1 overflow-hidden relative">
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
