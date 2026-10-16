import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Terminal,
  MapPin,
  ArrowRight,
  Code2,
  Copy,
  Check,
  ArrowUp,
} from "lucide-react";


export default function LandingPage() {
  const [activeMatrixTab, setActiveMatrixTab] = useState<"clean_arch" | "postgis" | "redis">("clean_arch");
  const [curlCopied, setCurlCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const copyQuickCurl = () => {
    navigator.clipboard.writeText("curl -s https://api.kenyaboundaries.com/api/v1/counties | jq .");
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 350);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    const checkScroll = () => {
      const depth = container ? container.scrollTop : window.scrollY;
      setShowScrollTop(depth > 350);
    };

    if (container) {
      container.addEventListener("scroll", checkScroll, { passive: true });
    }
    window.addEventListener("scroll", checkScroll, { passive: true });

    return () => {
      if (container) container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full w-full bg-[#0D0E15] text-[#F4F5F6] overflow-y-auto overflow-x-hidden bg-nexus-grid relative scroll-smooth overscroll-y-contain"
    >
      {/* Ambient Volt Glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-volt-radial pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        {/* Acid Volt Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#D1FF00] text-[#0D0E15] font-mono text-[11px] font-bold tracking-[0.3em] uppercase rounded-sm mb-6 shadow-sm">
          <Terminal className="h-3.5 w-3.5" />
          <span>GEOSPATIAL REST API // v1.0.0</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.05]">
          KENYA ADMIN <br />
          <span className="text-[#D1FF00]">BOUNDARIES API</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-[#8B94A5] max-w-2xl leading-relaxed">
          A production-grade geospatial REST engine mapping Kenya&apos;s complete administrative
          and electoral boundaries down to the constituency level. Engineered with{" "}
          <strong className="text-white">Golang 1.25</strong> Clean Architecture,{" "}
          <strong className="text-white">PostGIS 3.3</strong> spatial indexing, and{" "}
          <strong className="text-white">Redis 7</strong> in-memory caching.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/docs"
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-[#D1FF00] text-[#0D0E15] font-semibold text-xs uppercase tracking-wider hover:bg-[#bce600] transition-all shadow-lg hover:shadow-[#D1FF00]/20"
          >
            <Code2 className="h-4 w-4" />
            <span>Open API Docs & Console</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/map"
            className="flex items-center gap-2 px-6 py-3 rounded-md bg-[#161822] border border-white/10 text-white font-semibold text-xs uppercase tracking-wider hover:bg-[#1F2336] hover:border-[#D1FF00]/40 transition-all"
          >
            <MapPin className="h-4 w-4 text-[#D1FF00]" />
            <span>Interactive Map Explorer</span>
          </Link>
        </div>

        {/* Quick cURL Bar */}
        <div className="mt-8 w-full max-w-xl flex items-center justify-between p-2.5 rounded-lg bg-[#141724]/90 border border-white/10 backdrop-blur-md font-mono text-xs">
          <div className="flex items-center gap-2 text-zinc-300 truncate pl-2">
            <span className="text-[#D1FF00]">$</span>
            <span className="truncate">curl -s http://localhost:18080/api/v1/counties | jq .</span>
          </div>
          <button
            onClick={copyQuickCurl}
            className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-zinc-300 transition-colors shrink-0 ml-2"
          >
            {curlCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#D1FF00]" />
                <span className="text-[#D1FF00]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Telemetry HUD Grid (Nexus Node telemetry aesthetic) */}
      <section className="px-6 max-w-7xl mx-auto pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "COUNTIES", val: "47", sub: "GeoJSON MultiPolygons" },
            { label: "CONSTITUENCIES", val: "290", sub: "Parliamentary Bounds" },
            { label: "SUB-COUNTIES", val: "412", sub: "Administrative Units" },
            { label: "WARDS", val: "1,450", sub: "Political Wards" },
            { label: "CACHE LATENCY", val: "< 1.2ms", sub: "Redis 7 In-Memory" },
            { label: "SPATIAL INDEX", val: "GIST", sub: "Sub-ms Intersections" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-[#141724]/80 border border-white/5 hud-border hover:border-[#D1FF00]/40 transition-colors flex flex-col justify-between"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#8B94A5]">
                {item.label}
              </span>
              <div className="my-2 text-2xl font-black font-mono tracking-tight text-white">
                {item.val}
              </div>
              <span className="text-[11px] text-[#8B94A5] truncate">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Matrix Tabs (Architecture & Specifications) */}
      <section className="px-6 max-w-7xl mx-auto py-16 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Selector */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#D1FF00]">
                02 // Technical Specifications
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                Engineered for High-Throughput Spatial Querying
              </h2>
            </div>

            {/* Matrix Tabs */}
            <div className="space-y-2">
              {[
                {
                  id: "clean_arch",
                  num: "01.",
                  name: "GOLANG CLEAN ARCHITECTURE",
                  desc: "Strict separation between domain entities, sqlc type-safe repositories, caching interfaces, and HTTP transport delivery handlers.",
                },
                {
                  id: "postgis",
                  num: "02.",
                  name: "POSTGIS 3.3 SPATIAL INDEXING",
                  desc: "2D GIST indexes enable sub-millisecond bounding box filtering and ST_Intersects spatial polygon containment checks.",
                },
                {
                  id: "redis",
                  num: "03.",
                  name: "REDIS IN-MEMORY DISTRIBUTION",
                  desc: "Pre-computed GeoJSON representations cached with fixed-window rate limiting to ensure 99.99% uptime under high traffic.",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMatrixTab(tab.id as "clean_arch" | "postgis" | "redis")}
                  className={`w-full text-left p-4 rounded-lg border transition-all text-xs ${
                    activeMatrixTab === tab.id
                      ? "bg-[#141724] border-[#D1FF00] shadow-sm"
                      : "bg-[#10121A]/50 border-white/5 hover:border-white/20 text-[#8B94A5]"
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono font-bold text-white mb-1">
                    <span className="text-[#D1FF00]">{tab.num}</span>
                    <span>{tab.name}</span>
                  </div>
                  <p className="text-[#8B94A5] leading-relaxed pl-5">{tab.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Dynamic Terminal Showcase */}
          <div className="lg:col-span-7 rounded-xl overflow-hidden border border-white/10 bg-[#0A0B10] shadow-2xl flex flex-col justify-between">
            {/* Terminal Top Window Bar */}
            <div className="px-5 py-3 border-b border-white/10 bg-[#12141D] flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56]/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F]/80 inline-block" />
                <span className="ml-2 text-xs text-[#8B94A5]">
                  {activeMatrixTab === "clean_arch" && "bash: ~/kenya-api/routes.sh"}
                  {activeMatrixTab === "postgis" && "psql: spatial_pg (postgis 3.3)"}
                  {activeMatrixTab === "redis" && "redis-cli: spatial_redis (in-memory)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#D1FF00] font-bold">
                  FIG. {activeMatrixTab.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                  ● ACTIVE
                </span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-6 font-mono text-xs overflow-x-auto leading-relaxed flex-1 bg-[#0A0B10]">
              {activeMatrixTab === "clean_arch" && (
                <div className="space-y-3">
                  <div className="text-zinc-500">// REST API Core Route Registry &amp; GeoJSON Output</div>
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
                      <div key={i} className="flex items-center gap-3 text-xs py-1 hover:bg-white/5 px-2 rounded transition-colors">
                        <span className="text-[#D1FF00] font-bold w-10 shrink-0">{route.method}</span>
                        <span className="text-white font-medium flex-1 truncate">{route.path}</span>
                        <span className="text-[#8B94A5] text-[11px] shrink-0 font-sans">{route.res}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeMatrixTab === "postgis" && (
                <div className="space-y-3">
                  <div className="text-zinc-500">-- High-Performance 2D GIST Spatial Intersection Query</div>
                  <pre className="text-zinc-300">
                    <span className="text-[#D1FF00]">SELECT</span> county_code, county_name,{"\n"}
                    {"  "}<span className="text-cyan-400">ST_AsGeoJSON</span>(geom)::json <span className="text-[#D1FF00]">AS</span> geometry{"\n"}
                    <span className="text-[#D1FF00]">FROM</span> counties{"\n"}
                    <span className="text-[#D1FF00]">WHERE</span> <span className="text-cyan-400">ST_Intersects</span>(geom, <span className="text-cyan-400">ST_MakeEnvelope</span>(34.0, -4.5, 42.0, 5.0, 4326));
                  </pre>
                  <div className="border-t border-white/10 pt-3 text-zinc-400 text-[11px] space-y-1">
                    <div><span className="text-emerald-400 font-bold">Index Scan:</span> idx_counties_geom_gist on counties (cost=0.14..8.25)</div>
                    <div><span className="text-emerald-400 font-bold">Execution Time:</span> <span className="text-[#D1FF00] font-bold">0.428 ms</span> (sub-millisecond spatial lookup)</div>
                  </div>
                </div>
              )}

              {activeMatrixTab === "redis" && (
                <div className="space-y-2.5">
                  <div className="text-zinc-500"># Redis 7 In-Memory Multi-Tier Spatial Cache</div>
                  <div className="text-zinc-300 font-bold">$ redis-cli -p 6379</div>
                  <div className="pl-2 space-y-1.5 text-zinc-300">
                    <div>127.0.0.1:6379&gt; GET geo:county:KE047:geojson</div>
                    <div className="text-emerald-400 pl-4 font-semibold">-&gt; [CACHE HIT] 48,210 bytes in-memory buffer</div>
                    <div>127.0.0.1:6379&gt; TTL geo:county:KE047:geojson</div>
                    <div className="text-cyan-400 pl-4 font-semibold">-&gt; (integer) 84312 [23h 25m remaining]</div>
                    <div>127.0.0.1:6379&gt; LATENCY latest</div>
                    <div className="text-[#D1FF00] pl-4 font-semibold">-&gt; &quot;geo:county:*&quot; 0.82ms latency</div>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Status Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-[#12141D] flex items-center justify-between text-xs text-[#8B94A5] font-mono">
              <span className="text-[11px]">WGS 84 (EPSG:4326) // PostGIS 3.3 GIST</span>
              <Link to="/docs" className="text-[#D1FF00] hover:underline flex items-center gap-1 font-semibold">
                <span>View Full Schema Docs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Direct CTA Bar before Footer */}
      <section className="px-6 max-w-7xl mx-auto py-12 border-t border-white/5">
        <div className="rounded-2xl bg-gradient-to-r from-[#141724] to-[#1F2336] border border-white/10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Ready to Integrate Kenya Administrative Boundaries?
            </h2>
            <p className="text-xs md:text-sm text-[#8B94A5] mt-2 max-w-xl">
              Access the live interactive developer console to test queries, inspect GeoJSON responses, and copy code snippets.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/docs"
              className="px-6 py-3 rounded-md bg-[#D1FF00] text-[#0D0E15] font-bold text-xs uppercase tracking-wider hover:bg-[#bce600] transition-all shadow-md"
            >
              Test Endpoints Live
            </Link>
            <Link
              to="/map"
              className="px-5 py-3 rounded-md bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider border border-white/10 transition-all"
            >
              View Map
            </Link>
          </div>
        </div>
      </section>

      {/* Industrial Footer HUD */}
      <footer className="border-t border-white/10 bg-[#0A0B10] px-6 py-6 text-xs text-[#8B94A5] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#D1FF00] font-bold">🇰🇪 KENYA ADMIN BOUNDARIES</span>
            <span>// OPEN SOURCE GEOSPATIAL API</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-white transition-colors">
              Docs & Console
            </Link>
            <Link to="/map" className="hover:text-white transition-colors">
              Map Explorer
            </Link>
            <a
              href="https://github.com/paulakelo/kenya-admin-boundaries-api"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Upward Arrow (Toggle to Top) Button - Appears past 350px scroll depth */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Toggle upward to top"
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center p-3 rounded-xl bg-[#141724]/90 backdrop-blur-md border border-[#D1FF00]/40 text-[#D1FF00] shadow-[0_0_20px_rgba(209,255,0,0.25)] hover:shadow-[0_0_30px_rgba(209,255,0,0.5)] hover:border-[#D1FF00] hover:bg-[#1E2336] transition-all duration-300 group cursor-pointer ${
          showScrollTop
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-6 scale-90 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center">
          <ArrowUp className="h-5 w-5 text-[#D1FF00] group-hover:-translate-y-1 transition-transform duration-200" />
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#D1FF00] uppercase mt-0.5">
            TOP
          </span>
        </div>
      </button>
    </div>
  );
}
