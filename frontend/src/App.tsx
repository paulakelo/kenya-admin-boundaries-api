import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Playground from "./views/Playground";
import ApiDocs from "./views/ApiDocs";
import { Map, BookOpen, Github } from "lucide-react";
import "./index.css";


function NavigationHeader() {
  const location = useLocation();
  const isDocs = location.pathname.startsWith("/docs");

  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 z-50 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl">🇰🇪</span>
          <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
            Kenya Admin Boundaries API
          </span>
        </Link>
        <span className="text-muted-foreground/40 text-sm hidden sm:inline">|</span>
        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
          v1.0.0
        </span>
      </div>

      {/* Navigation Switcher Tabs */}
      <nav className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
        <Link
          to="/"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            !isDocs
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span>Map Explorer</span>
        </Link>
        <Link
          to="/docs"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            isDocs
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>API Docs & Console</span>
        </Link>
      </nav>

      {/* Right side utilities */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>API Online</span>
        </div>

        <a
          href="https://github.com/paulakelo/kenya-admin-boundaries-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="View GitHub Repository"
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
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
        <NavigationHeader />
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Playground />} />
            <Route path="/map" element={<Playground />} />
            <Route path="/docs" element={<ApiDocs />} />
            <Route path="*" element={<Playground />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
