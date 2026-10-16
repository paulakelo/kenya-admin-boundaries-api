import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Terminal,
  MapPin,
  ArrowRight,
  Code2,
  Copy,
  Check,
} from "lucide-react";


export default function LandingPage() {
  const [activeSlice, setActiveSlice] = useState<number>(0);
  const [activeMatrixTab, setActiveMatrixTab] = useState<"clean_arch" | "postgis" | "redis">("clean_arch");
  const [curlCopied, setCurlCopied] = useState(false);

  const copyQuickCurl = () => {
    navigator.clipboard.writeText("curl -s https://api.kenyaboundaries.com/api/v1/counties | jq .");
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  const slices = [
    {
      id: "A.01",
      category: "Compute",
      title: "Spatial Geometry Engine",
      description:
        "High-performance PostGIS 3.3 spatial intersections with dedicated GIST indexes. Delivers accurate WGS 84 (EPSG:4326) MultiPolygon GeoJSON.",
      image: "/images/nexus-core.jpg",
    },
    {
      id: "A.02",
      category: "Thermal",
      title: "In-Memory Caching Fabric",
      description:
        "Sub-millisecond Redis 7 caching layer with automatic 24-hour TTL, mitigating database load for frequently requested national boundaries.",
      image: "/images/nexus-flux.jpg",
    },
    {
      id: "A.03",
      category: "Hierarchy",
      title: "Administrative Matrix",
      description:
        "Strict relational hierarchy mapping all 47 Counties, 290 Parliamentary Constituencies, 412 Sub-Counties, and 1,450 Wards.",
      image: "/images/nexus-grid.jpg",
    },
    {
      id: "A.04",
      category: "Delivery",
      title: "Interactive Console",
      description:
        "Built-in live API tester and multi-language code snippet generator (cURL, JavaScript, Python, Go) with zero authentication barriers.",
      image: "/images/nexus-sync.jpg",
    },
  ];

  return (
    <div className="min-h-full w-full bg-[#0D0E15] text-[#F4F5F6] overflow-y-auto bg-nexus-grid relative">
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

      {/* Kinetic System Slices (Nexus Card 3 Accordion Fold) */}
      <section className="px-6 max-w-7xl mx-auto py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#D1FF00]">
              02 // System Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
              Four Core Subsystems. One Unified Spine.
            </h2>
          </div>
          <p className="text-xs font-mono text-[#8B94A5]">
            Select any subsystem to inspect spatial capability
          </p>
        </div>

        {/* Interactive Accordion Slices */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {slices.map((slice, index) => {
            const isActive = activeSlice === index;
            return (
              <div
                key={slice.id}
                onClick={() => setActiveSlice(index)}
                className={`group relative rounded-xl overflow-hidden border transition-all duration-300 cursor-pointer min-h-[300px] flex flex-col justify-between p-6 ${
                  isActive
                    ? "border-[#D1FF00] shadow-xl shadow-[#D1FF00]/10"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(13,14,21,0.6), rgba(13,14,21,0.92)), url(${slice.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Header tag */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#D1FF00]">
                    {slice.id}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                    {slice.category}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-auto pt-6">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#D1FF00] transition-colors">
                    {slice.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#8B94A5] leading-relaxed line-clamp-3">
                    {slice.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Matrix Tabs (Nexus Card 4 Matrix) */}
      <section className="px-6 max-w-7xl mx-auto py-16 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Interactive Selector */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#D1FF00]">
                03 // Technical Specifications
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

          {/* Right Column: Dynamic Matrix Showcase Banner */}
          <div className="lg:col-span-7 rounded-xl overflow-hidden border border-white/10 relative bg-[#141724] min-h-[380px] flex flex-col justify-between p-8">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url(${
                  activeMatrixTab === "clean_arch"
                    ? "/images/nexus-tab-core.jpg"
                    : activeMatrixTab === "postgis"
                    ? "/images/nexus-tab-fluidics.jpg"
                    : "/images/nexus-tab-sync.jpg"
                })`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            <div className="relative z-10 flex items-center justify-between">
              <span className="font-mono text-xs text-[#D1FF00] font-bold">
                FIG. {activeMatrixTab.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                ● PROD_READY
              </span>
            </div>

            <div className="relative z-10 my-8">
              <div className="font-mono text-xs text-[#D1FF00] mb-2 uppercase tracking-widest">
                API Standard / JSON & GeoJSON
              </div>
              <pre className="p-4 rounded-lg bg-black/80 border border-white/10 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
{activeMatrixTab === "clean_arch" && `// Standard REST API Route Definition
GET /api/v1/counties
GET /api/v1/counties/:slug
GET /api/v1/counties/:slug/hierarchy
GET /api/v1/counties/:slug/constituencies
GET /api/v1/constituencies
GET /api/v1/sub-counties
GET /api/v1/wards`}

{activeMatrixTab === "postgis" && `SELECT 
  county_code,
  county_name,
  ST_AsGeoJSON(geom)::json AS geometry
FROM counties
WHERE ST_Intersects(geom, ST_MakeEnvelope(34.0, -4.5, 42.0, 5.0, 4326));`}

{activeMatrixTab === "redis" && `// Redis 7 Fast Cache Lookup
KEY:   geo:county:KE047:geojson
TTL:   86400s (24 Hours)
HIT:   0.8ms average response time
MISS:  Falls back to PostgreSQL with pgxpool`}
              </pre>
            </div>

            <div className="relative z-10 flex items-center justify-between text-xs text-[#8B94A5] font-mono border-t border-white/10 pt-4">
              <span>WGS 84 (EPSG:4326)</span>
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
    </div>
  );
}
