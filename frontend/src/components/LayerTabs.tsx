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
        <TabsList className="bg-card/90 backdrop-blur-md border border-border shadow-lg p-0.5 h-8">
          <TabsTrigger value="counties" className="text-xs font-semibold px-3 py-1">
            Counties (47)
          </TabsTrigger>
          <TabsTrigger value="constituencies" className="text-xs font-semibold px-3 py-1">
            Constituencies (290)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Basemap Switcher */}
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-lg shadow-lg flex items-center p-0.5 h-8 text-[11px]">
        <button
          onClick={() => onBasemapChange("dark")}
          className={`px-2 py-1 rounded font-medium transition-all flex items-center gap-1 ${
            basemap === "dark"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Esri World Dark Gray (No watermarks)"
        >
          <Layers className="h-3 w-3" />
          <span>Dark</span>
        </button>
        <button
          onClick={() => onBasemapChange("osm")}
          className={`px-2 py-1 rounded font-medium transition-all flex items-center gap-1 ${
            basemap === "osm"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="OpenStreetMap Standard"
        >
          <MapIcon className="h-3 w-3" />
          <span>OSM</span>
        </button>
        <button
          onClick={() => onBasemapChange("satellite")}
          className={`px-2 py-1 rounded font-medium transition-all flex items-center gap-1 ${
            basemap === "satellite"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
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
