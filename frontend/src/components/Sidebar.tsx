import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Loader2 } from "lucide-react";


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

interface ConstituencyItem {
  code?: string;
  name?: string;
  constituency_code?: string;
  constituency_name?: string;
}

interface HierarchyResponse {
  county_code: string;
  county_name: string;
  constituencies: ConstituencyItem[];
}

interface SidebarProps {
  onCountySelect: (code: string, name: string) => void;
  onConstituencySelect?: (code: string, name: string) => void;
  selectedCode?: string | null;
}

export default function Sidebar({
  onCountySelect,
  onConstituencySelect,
  selectedCode,
}: SidebarProps) {
  const [counties, setCounties] = useState<CountyFeature[]>([]);
  const [subCounties, setSubCounties] = useState<Record<string, SubCounty[]>>({});
  const [constituenciesMap, setConstituenciesMap] = useState<Record<string, ConstituencyItem[]>>({});
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
    <div className="h-full flex flex-col bg-surface-sunken border-r border-border-strong select-none">
      {/* Header Info */}
      <div className="p-4 border-b border-border-strong bg-surface-base">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xl">🇰🇪</span>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-text-heading">
              Kenya Admin Explorer
            </h2>
            <p className="text-[11px] text-text-muted">
              47 Counties • 290 Constituencies • 412 Sub-Counties
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
          <label htmlFor="county-search" className="sr-only">
            Search county by name or code
          </label>
          <input
            id="county-search"
            type="text"
            placeholder="Search county (e.g. Nairobi, KE047)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-md bg-surface-sunken border border-border-strong focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-text-heading placeholder:text-text-muted/50 transition-colors"
          />
        </div>
      </div>

      {/* Counties List Header & count */}
      <div className="px-4 py-2.5 border-b border-border-strong bg-surface-base flex items-center justify-between text-xs text-text-heading font-semibold">
        <span>COUNTIES ({filteredCounties.length})</span>
        <span className="text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded border border-accent/30">
          PostGIS Indexed
        </span>
      </div>

      {/* County List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredCounties.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted">
            No counties match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          <Accordion className="space-y-1.5">
            {filteredCounties.map((county) => {
              const code = county.properties.code;
              const name = county.properties.name;
              const isSelected = selectedCode === code;
              const subCountiesList = subCounties[code];
              const constituencyList = constituenciesMap[code];

              return (
                <AccordionItem
                  key={code}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? "bg-surface-overlay border-border-strong border-l-2 border-l-accent shadow-xs"
                      : "border-border-subtle bg-surface-base hover:bg-surface-raised"
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
                            isSelected ? "text-accent" : "text-text-muted"
                          }`}
                        />
                        <span className={isSelected ? "font-bold text-text-heading" : "text-text-body"}>
                          {name}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono bg-surface-sunken text-text-muted border border-border-subtle">
                        {code}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-sunken">
                    <div className="space-y-2.5">
                      {/* Sub-view toggle (Sub-Counties vs Constituencies) */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1 bg-surface-base p-1 rounded-md text-[10px] border border-border-strong w-full">
                          <button
                            type="button"
                            onClick={() => setViewDetail("subcounties")}
                            className={`flex-1 py-1 rounded font-medium transition-all text-center cursor-pointer ${
                              viewDetail === "subcounties"
                                ? "bg-accent text-black font-bold shadow-xs"
                                : "text-text-muted hover:text-text-heading hover:bg-surface-overlay"
                            }`}
                          >
                            Sub-Counties ({subCountiesList ? subCountiesList.length : "…"})
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewDetail("constituencies")}
                            className={`flex-1 py-1 rounded font-medium transition-all text-center cursor-pointer ${
                              viewDetail === "constituencies"
                                ? "bg-rose-500 text-white font-bold shadow-xs"
                                : "text-text-muted hover:text-text-heading hover:bg-surface-overlay"
                            }`}
                          >
                            Constituencies ({constituencyList ? constituencyList.length : "…"})
                          </button>
                        </div>
                      </div>

                      {/* Content Section */}
                      {loadingCode === code ? (
                        <div className="flex items-center gap-2 py-3 text-xs text-text-muted justify-center">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                          <span>Loading hierarchy from API...</span>
                        </div>
                      ) : viewDetail === "subcounties" ? (
                        subCountiesList && subCountiesList.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                            {subCountiesList.map((sc) => (
                              <div
                                key={sc.sub_county_code}
                                className="text-[11px] text-text-body pl-2.5 pr-2 py-1.5 border-l-2 border-accent/60 hover:border-accent hover:text-text-heading hover:bg-accent/10 transition-colors flex items-center justify-between rounded-r bg-surface-base border border-border-subtle"
                              >
                                <span className="font-medium truncate">{sc.sub_county_name}</span>
                                <span className="text-[9px] font-mono text-text-muted shrink-0 ml-1.5">
                                  {sc.sub_county_code}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-text-muted italic py-1">
                            Click to query sub-counties
                          </p>
                        )
                      ) : (
                        constituencyList && constituencyList.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                            {constituencyList.map((c) => {
                              const cCode = c.code || c.constituency_code || "";
                              const cName = c.name || c.constituency_name || "Constituency";
                              const isCSelected = selectedCode === cCode;

                              return (
                                <button
                                  key={cCode}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onConstituencySelect?.(cCode, cName);
                                  }}
                                  className={`w-full text-left text-[11px] pl-2.5 pr-2 py-1.5 border-l-2 transition-all flex items-center justify-between rounded-r group cursor-pointer ${
                                    isCSelected
                                      ? "border-rose-400 bg-rose-500/25 text-white font-semibold shadow-xs"
                                      : "border-rose-500/50 bg-surface-base text-text-body hover:border-rose-400 hover:text-white hover:bg-rose-500/15"
                                  }`}
                                  title={`Click to view and zoom to ${cName}`}
                                >
                                  <span className="truncate text-text-body group-hover:text-text-heading font-medium">
                                    {cName}
                                  </span>
                                  <span
                                    className={`text-[9px] font-mono shrink-0 ml-1.5 ${
                                      isCSelected
                                        ? "text-rose-300 font-bold"
                                        : "text-text-muted group-hover:text-text-body"
                                    }`}
                                  >
                                    {cCode}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-text-muted italic py-1">
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
