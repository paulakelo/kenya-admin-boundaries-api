import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import type { FeatureCollection } from "geojson";
import KenyaMap from "../components/KenyaMap";
import LayerTabs from "../components/LayerTabs";
import Sidebar from "../components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Layers, X, ArrowLeft, BookOpen } from "lucide-react";

const API_BASE = "http://localhost:18080/api/v1";
type LayerType = "counties" | "constituencies";
type BasemapType = "dark" | "osm" | "satellite";

export default function Playground() {
  const [counties, setCounties] = useState<FeatureCollection | null>(null);
  const [constituencies, setConstituencies] = useState<FeatureCollection | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerType>("counties");
  const [basemap, setBasemap] = useState<BasemapType>("dark");
  const [flyToCode, setFlyToCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedFeatureName, setSelectedFeatureName] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    axios
      .get<FeatureCollection>(`${API_BASE}/counties`)
      .then((res) => setCounties(res.data))
      .catch((err) => console.error("Failed to load counties:", err));

    axios
      .get<FeatureCollection>(`${API_BASE}/constituencies`)
      .then((res) => setConstituencies(res.data))
      .catch((err) => console.error("Failed to load constituencies:", err));
  }, []);

  // County selected from sidebar
  const handleCountySelect = (code: string, name: string) => {
    setActiveLayer("counties");
    setSelectedCode(code);
    setSelectedFeatureName(name);
    setFlyToCode(code);
    setTimeout(() => setFlyToCode(null), 1000);
  };

  // Constituency selected from sidebar
  const handleConstituencySelect = (code: string, name: string) => {
    setActiveLayer("constituencies");
    setSelectedCode(code);
    setSelectedFeatureName(name);
    setFlyToCode(code);
    setTimeout(() => setFlyToCode(null), 1000);
  };

  // Polygon clicked on the map
  const handleFeatureSelect = (code: string, name: string) => {
    if (selectedCode === code) {
      setSelectedCode(null);
      setSelectedFeatureName(null);
    } else {
      setSelectedCode(code);
      setSelectedFeatureName(name);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-base text-text-body relative font-sans">
      {/* Collapsible Sidebar */}
      <aside
        aria-label="Administrative Boundaries Explorer"
        className={`w-80 min-w-80 h-full transition-all duration-200 z-10 ${
          isSidebarOpen ? "block" : "hidden"
        }`}
      >
        <Sidebar
          onCountySelect={handleCountySelect}
          onConstituencySelect={handleConstituencySelect}
          selectedCode={selectedCode}
        />
      </aside>

      {/* Map Content Area */}
      <main className="flex-1 relative w-full h-full bg-surface-sunken overflow-hidden">
        {/* Layer & Basemap Switcher Toolbar */}
        <LayerTabs
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />

        {/* Floating Toolbar with Navigation */}
        <nav aria-label="Map Tools" className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-expanded={isSidebarOpen}
            className="p-2 rounded-md bg-surface-raised border border-border-subtle text-text-heading hover:bg-surface-overlay transition-colors shadow-sm text-xs flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title={isSidebarOpen ? "Collapse explorer sidebar" : "Expand explorer sidebar"}
          >
            <Layers className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span className="font-semibold">{isSidebarOpen ? "Hide Explorer" : "Show Explorer"}</span>
          </button>

          <Link
            to="/"
            className="p-2 rounded-md bg-surface-raised border border-border-subtle text-text-heading hover:bg-surface-overlay transition-colors shadow-sm text-xs flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Return to Portal Overview"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Home</span>
          </Link>

          <Link
            to="/docs"
            className="p-2 rounded-md bg-surface-raised border border-border-subtle text-text-heading hover:bg-surface-overlay transition-colors shadow-sm text-xs flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Open API Reference"
          >
            <BookOpen className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>Docs</span>
          </Link>
        </nav>

        {/* Selected Polygon Information Panel */}
        {selectedCode && (
          <aside
            aria-label="Selected Boundary Details"
            className="absolute bottom-6 left-6 z-[1000] bg-surface-raised border border-border-subtle rounded-lg p-4 shadow-xl max-w-xs animate-in fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">
                  {activeLayer === "counties" ? "Selected County" : "Selected Constituency"}
                </span>
                <h2 className="text-sm font-bold text-text-heading">
                  {selectedFeatureName || selectedCode}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    Code: {selectedCode}
                  </Badge>
                  <span className="text-xs text-emerald-400 font-medium">
                    ● GeoJSON Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCode(null);
                  setSelectedFeatureName(null);
                }}
                aria-label="Dismiss selection"
                className="text-text-muted hover:text-text-heading p-1 cursor-pointer rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </aside>
        )}

        {/* Interactive Leaflet Map */}
        <div className="w-full h-full">
          <KenyaMap
            counties={counties}
            constituencies={constituencies}
            activeLayer={activeLayer}
            flyToCode={flyToCode}
            selectedCode={selectedCode}
            onFeatureSelect={handleFeatureSelect}
            basemap={basemap}
          />
        </div>
      </main>
    </div>
  );
}
