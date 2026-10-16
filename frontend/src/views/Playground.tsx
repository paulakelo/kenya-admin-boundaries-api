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
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground relative">
      {/* Collapsible Sidebar */}
      <aside
        className={`w-[360px] min-w-[360px] h-full transition-all duration-300 z-10 ${
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
      <main className="flex-1 relative w-full h-full bg-black overflow-hidden">
        {/* Layer & Basemap Switcher Toolbar */}
        <LayerTabs
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />

        {/* Toggle Sidebar & Back Links floating toolbar */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1.5">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2 rounded-lg bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-accent shadow-md transition-all text-xs flex items-center gap-1.5"
            title="Toggle Sidebar"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{isSidebarOpen ? "Hide Sidebar" : "Show Explorer"}</span>
          </button>

          <Link
            to="/"
            className="p-2 rounded-lg bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-accent shadow-md transition-all text-xs flex items-center gap-1 font-semibold"
            title="Back to Overview"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-primary" />
            <span>Home</span>
          </Link>

          <Link
            to="/docs"
            className="p-2 rounded-lg bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-accent shadow-md transition-all text-xs flex items-center gap-1 font-semibold"
            title="Open API Docs & Console"
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Docs</span>
          </Link>
        </div>

        {/* Selected Polygon Info Floating Pill */}
        {selectedCode && (
          <div className="absolute bottom-6 left-6 z-[1000] bg-card/95 backdrop-blur-md border border-border/80 rounded-xl p-3.5 shadow-xl max-w-xs animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {activeLayer === "counties" ? "Selected County" : "Selected Constituency"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {selectedFeatureName || selectedCode}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    Code: {selectedCode}
                  </Badge>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    ● GeoJSON Active
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCode(null);
                  setSelectedFeatureName(null);
                }}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
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
