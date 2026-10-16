import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Layers, Building2, ChevronRight, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:18080/api/v1";

interface CountyFeature {
  type: string;
  id: string;
  properties: {
    code: string;
    name: string;
  };
  geometry: unknown;
}

interface CountiesResponse {
  type: string;
  features: CountyFeature[];
}

interface SubCounty {
  county_code: string;
  county_name: string;
  sub_county_code: string;
  sub_county_name: string;
}

interface SubCountiesResponse {
  sub_counties: SubCounty[];
}

interface HierarchyResponse {
  county_code: string;
  county_name: string;
  constituencies: Array<{
    constituency_code: string;
    constituency_name: string;
  }>;
}

interface SidebarProps {
  onCountySelect: (code: string, name: string) => void;
  selectedCode?: string | null;
}

export default function Sidebar({ onCountySelect, selectedCode }: SidebarProps) {
  const [counties, setCounties] = useState<CountyFeature[]>([]);
  const [subCounties, setSubCounties] = useState<Record<string, SubCounty[]>>({});
  const [constituenciesMap, setConstituenciesMap] = useState<Record<string, Array<{ constituency_code: string; constituency_name: string }>>>({});
  const [loadingCode, setLoadingCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDetail, setViewDetail] = useState<"subcounties" | "constituencies">("subcounties");

  useEffect(() => {
    axios
      .get<CountiesResponse>(`${API_BASE}/counties`)
      .then((res) => {
        const sorted = [...(res.data?.features || [])].sort((a, b) =>
          a.properties.name.localeCompare(b.properties.name)
        );
        setCounties(sorted);
      })
      .catch((err) => console.error("Failed to load counties:", err));
  }, []);

  const fetchCountyDetails = (code: string) => {
    if (loadingCode === code) return;

    if (!subCounties[code]) {
      setLoadingCode(code);
      axios
        .get<SubCountiesResponse>(`${API_BASE}/counties/${code}/sub-counties`)
        .then((res) => {
          setSubCounties((prev) => ({
            ...prev,
            [code]: res.data.sub_counties || [],
          }));
        })
        .catch((err) => console.error("Failed to load sub-counties:", err))
        .finally(() => setLoadingCode(null));
    }

    if (!constituenciesMap[code]) {
      axios
        .get<HierarchyResponse>(`${API_BASE}/counties/${code}/hierarchy`)
        .then((res) => {
          setConstituenciesMap((prev) => ({
            ...prev,
            [code]: res.data.constituencies || [],
          }));
        })
        .catch((err) => console.error("Failed to load hierarchy:", err));
    }
  };

  const handleTriggerClick = (code: string, name: string) => {
    onCountySelect(code, name);
    fetchCountyDetails(code);
  };

  const filteredCounties = useMemo(() => {
    if (!searchQuery.trim()) return counties;
    const q = searchQuery.toLowerCase();
    return counties.filter(
      (c) =>
        c.properties.name.toLowerCase().includes(q) ||
        c.properties.code.toLowerCase().includes(q)
    );
  }, [counties, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border select-none">
      {/* Header Info */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xl">🇰🇪</span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Kenya Admin Explorer
            </h2>
            <p className="text-[11px] text-muted-foreground">
              47 Counties • 290 Constituencies • 412 Sub-Counties
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search county (e.g. Nairobi, KE047)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Counties List Header & count */}
      <div className="px-4 py-2 border-b border-border/60 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
        <span>COUNTIES ({filteredCounties.length})</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          PostGIS Indexed
        </span>
      </div>

      {/* County List */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredCounties.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No counties match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <Accordion className="space-y-1">
            {filteredCounties.map((county) => {
              const code = county.properties.code;
              const name = county.properties.name;
              const isSelected = selectedCode === code;
              const subCountiesList = subCounties[code];
              const constituencyList = constituenciesMap[code];

              return (
                <AccordionItem
                  key={code}
                  className={`border border-border/40 rounded-lg overflow-hidden transition-all ${
                    isSelected ? "bg-accent/40 border-primary/50 shadow-sm" : "hover:bg-accent/20"
                  }`}
                >
                  <AccordionTrigger
                    className="py-2.5 px-3 text-xs font-medium hover:no-underline"
                    onClick={() => handleTriggerClick(code, name)}
                  >
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-2">
                        <MapPin
                          className={`h-3.5 w-3.5 ${
                            isSelected ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className={isSelected ? "font-semibold text-primary" : ""}>
                          {name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        {code}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 pb-3 pt-1 border-t border-border/30 bg-background/50">
                    <div className="space-y-2.5">
                      {/* Sub-view toggle (Sub-Counties vs Constituencies) */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1 bg-muted p-0.5 rounded text-[10px]">
                          <button
                            onClick={() => setViewDetail("subcounties")}
                            className={`px-2 py-0.5 rounded font-medium transition-all ${
                              viewDetail === "subcounties"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Sub-Counties ({subCountiesList ? subCountiesList.length : "…"})
                          </button>
                          <button
                            onClick={() => setViewDetail("constituencies")}
                            className={`px-2 py-0.5 rounded font-medium transition-all ${
                              viewDetail === "constituencies"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Constituencies ({constituencyList ? constituencyList.length : "…"})
                          </button>
                        </div>
                      </div>

                      {/* Content Section */}
                      {loadingCode === code ? (
                        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground justify-center">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span>Loading hierarchy from API...</span>
                        </div>
                      ) : viewDetail === "subcounties" ? (
                        subCountiesList && subCountiesList.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
                            {subCountiesList.map((sc) => (
                              <div
                                key={sc.sub_county_code}
                                className="text-[11px] text-foreground/80 pl-2.5 py-1 border-l-2 border-primary/30 hover:border-primary hover:text-foreground transition-colors flex items-center justify-between rounded-r bg-muted/20"
                              >
                                <span>{sc.sub_county_name}</span>
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  {sc.sub_county_code}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic py-1">
                            Click to query sub-counties
                          </p>
                        )
                      ) : (
                        constituencyList && constituencyList.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
                            {constituencyList.map((c) => (
                              <div
                                key={c.constituency_code}
                                className="text-[11px] text-foreground/80 pl-2.5 py-1 border-l-2 border-rose-500/40 hover:border-rose-500 hover:text-foreground transition-colors flex items-center justify-between rounded-r bg-muted/20"
                              >
                                <span>{c.constituency_name}</span>
                                <span className="text-[9px] font-mono text-muted-foreground">
                                  {c.constituency_code}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic py-1">
                            No constituency data loaded
                          </p>
                        )
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
