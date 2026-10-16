import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Map as MapIcon, Globe } from "lucide-react";

type LayerType = "counties" | "constituencies";
type BasemapType = "dark" | "osm" | "satellite";

interface LayerTabsProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
  basemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
}

export default function LayerTabs({
  activeLayer,
  onLayerChange,
  basemap,
  onBasemapChange,
}: LayerTabsProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
      {/* Layer selector */}
      <Tabs
        value={activeLayer}
        onValueChange={(v) => onLayerChange(v as LayerType)}
      >
        <TabsList className="bg-surface-raised border border-border-strong shadow-md p-0.5 h-8">
          <TabsTrigger value="counties" className="text-xs font-bold px-3 py-1 cursor-pointer data-[state=active]:bg-surface-overlay data-[state=active]:text-text-heading data-[state=active]:shadow-xs">
            Counties (47)
          </TabsTrigger>
          <TabsTrigger value="constituencies" className="text-xs font-bold px-3 py-1 cursor-pointer data-[state=active]:bg-surface-overlay data-[state=active]:text-text-heading data-[state=active]:shadow-xs">
            Constituencies (290)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Basemap Switcher */}
      <div className="bg-surface-raised border border-border-strong rounded-lg shadow-md flex items-center p-0.5 h-8 text-[11px]">
        <button
          type="button"
          onClick={() => onBasemapChange("dark")}
          className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
            basemap === "dark"
              ? "bg-accent text-black shadow-xs"
              : "text-text-muted hover:text-text-heading hover:bg-surface-overlay"
          }`}
          title="Esri World Dark Gray (No watermarks)"
        >
          <Layers className="h-3 w-3" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => onBasemapChange("osm")}
          className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
            basemap === "osm"
              ? "bg-accent text-black shadow-xs"
              : "text-text-muted hover:text-text-heading hover:bg-surface-overlay"
          }`}
          title="OpenStreetMap Standard"
        >
          <MapIcon className="h-3 w-3" />
          <span>OSM</span>
        </button>
        <button
          type="button"
          onClick={() => onBasemapChange("satellite")}
          className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer ${
            basemap === "satellite"
              ? "bg-accent text-black shadow-xs"
              : "text-text-muted hover:text-text-heading hover:bg-surface-overlay"
          }`}
          title="Esri Satellite Imagery"
        >
          <Globe className="h-3 w-3" />
          <span>Satellite</span>
        </button>
      </div>
    </div>
  );
}
