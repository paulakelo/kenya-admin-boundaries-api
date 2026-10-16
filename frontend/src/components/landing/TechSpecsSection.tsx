import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { TECHNICAL_SPECS } from "../../data/portalContent";
import type { TechSpecTab } from "../../data/portalContent";

export const TechSpecsSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<TechSpecTab["id"]>("clean_arch");

  const activeTab =
    TECHNICAL_SPECS.find((tab) => tab.id === activeTabId) || TECHNICAL_SPECS[0];

  return (
    <section aria-labelledby="specs-heading" className="px-6 max-w-7xl mx-auto py-16 border-t border-border-subtle">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Architectural Narrative & Tab List */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-medium">
              02 // Technical Specifications
            </span>
            <h2 id="specs-heading" className="text-2xl sm:text-3xl font-bold mt-2 text-text-heading leading-tight">
              Engineered for High-Throughput Spatial Querying
            </h2>
          </div>

          {/* Accessible Tab List */}
          <div role="tablist" aria-label="Architecture Specifications" className="space-y-2.5">
            {TECHNICAL_SPECS.map((tab) => {
              const isSelected = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? "bg-surface-raised border-2 border-accent text-text-heading shadow-md"
                      : "bg-surface-raised/80 border border-border-strong hover:border-accent/50 text-text-body hover:bg-surface-overlay"
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono font-bold text-text-heading mb-1.5">
                    <span className={isSelected ? "text-accent" : "text-text-muted"}>{tab.number}</span>
                    <span>{tab.title}</span>
                  </div>
                  <p className={`leading-relaxed pl-5 ${isSelected ? "text-text-body" : "text-text-muted"}`}>
                    {tab.narrative}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dark Terminal Panel */}
        <div
          id={`panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab.id}`}
          className="lg:col-span-7 rounded-xl overflow-hidden border border-border-strong bg-surface-sunken shadow-xl flex flex-col justify-between"
        >
          {/* Terminal Window Top Bar */}
          <div className="px-5 py-3 border-b border-border-strong bg-surface-raised flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EF4444]/90 inline-block" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-[#F59E0B]/90 inline-block" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-[#10B981]/90 inline-block" aria-hidden="true" />
              <span className="ml-2 text-xs text-text-heading font-semibold tracking-wide">
                {activeTab.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-mono font-medium">
                FIG. {activeTab.id.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Terminal Body Content */}
          <div className="p-6 font-mono text-xs overflow-x-auto leading-relaxed bg-surface-sunken">
            {activeTab.id === "clean_arch" && (
              <div className="space-y-3">
                <div className="text-text-muted">// REST API Route Registry &amp; Response Signatures</div>
                <div className="space-y-1.5 pt-1">
                  {[
                    { method: "GET", path: "/api/v1/counties", res: "GeoJSON FeatureCollection (47)" },
                    { method: "GET", path: "/api/v1/counties/:slug", res: "GeoJSON Feature (Single Polygon)" },
                    { method: "GET", path: "/api/v1/counties/:slug/hierarchy", res: "JSON { county, constituencies }" },
                    { method: "GET", path: "/api/v1/counties/:slug/constituencies", res: "GeoJSON FeatureCollection" },
                    { method: "GET", path: "/api/v1/constituencies", res: "GeoJSON FeatureCollection (290)" },
                    { method: "GET", path: "/api/v1/sub-counties", res: "JSON Array (412 Units)" },
                    { method: "GET", path: "/api/v1/wards", res: "JSON Array (1,450 Wards)" },
                  ].map((route, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-xs py-1 hover:bg-surface-raised px-2 rounded transition-colors"
                    >
                      <span className="text-accent font-bold w-10 shrink-0">{route.method}</span>
                      <span className="text-text-heading font-medium flex-1 truncate">{route.path}</span>
                      <span className="text-text-muted text-xs shrink-0 font-sans">{route.res}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab.id === "postgis" && (
              <div className="space-y-3">
                <div className="text-text-muted">-- High-Performance 2D GIST Spatial Query</div>
                <pre className="text-text-body">
                  <span className="text-accent">SELECT</span> county_code, county_name,{"\n"}
                  {"  "}<span className="text-cyan-400">ST_AsGeoJSON</span>(geom)::json <span className="text-accent">AS</span> geometry{"\n"}
                  <span className="text-accent">FROM</span> counties{"\n"}
                  <span className="text-accent">WHERE</span> <span className="text-cyan-400">ST_Intersects</span>(geom, <span className="text-cyan-400">ST_MakeEnvelope</span>(34.0, -4.5, 42.0, 5.0, 4326));
                </pre>
                <div className="border-t border-border-subtle pt-3 text-text-muted text-xs space-y-1">
                  <div>
                    <span className="text-emerald-400 font-semibold">Index Scan:</span> idx_counties_geom_gist on counties
                  </div>
                  <div>
                    <span className="text-emerald-400 font-semibold">Execution Time:</span>{" "}
                    <span className="text-accent font-bold">0.428 ms</span> (sub-millisecond spatial lookup)
                  </div>
                </div>
              </div>
            )}

            {activeTab.id === "redis" && (
              <div className="space-y-2.5">
                <div className="text-text-muted"># Redis 7 In-Memory Multi-Tier Spatial Cache</div>
                <div className="text-text-heading font-bold">$ redis-cli -p 6379</div>
                <div className="pl-2 space-y-1.5 text-text-body">
                  <div>127.0.0.1:6379&gt; GET geo:county:KE047:geojson</div>
                  <div className="text-emerald-400 pl-4 font-semibold">-&gt; [CACHE HIT] 48,210 bytes in-memory buffer</div>
                  <div>127.0.0.1:6379&gt; TTL geo:county:KE047:geojson</div>
                  <div className="text-cyan-400 pl-4 font-semibold">-&gt; (integer) 84312 [23h 25m remaining]</div>
                  <div>127.0.0.1:6379&gt; LATENCY latest</div>
                  <div className="text-accent pl-4 font-semibold">-&gt; &quot;geo:county:*&quot; 0.82ms latency</div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Footer */}
          <div className="px-5 py-3.5 border-t border-border-strong bg-surface-raised flex items-center justify-between text-xs text-text-muted font-mono">
            <span>WGS 84 (EPSG:4326) // PostGIS 3.3 GIST</span>
            <Link
              to="/docs"
              className="px-4 py-2 rounded-md bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-lime-300 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Explore API Docs &amp; Console</span>
              <ArrowRight className="h-3.5 w-3.5 text-black" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
