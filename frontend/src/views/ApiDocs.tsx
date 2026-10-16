import { useState } from "react";
import axios from "axios";
import {
  Code,
  Terminal,
  Send,
  Copy,
  Check,
  Zap,
  Database,
  Clock,
  Server,
} from "lucide-react";


interface Endpoint {
  id: string;
  category: "Counties" | "Constituencies" | "Sub-Counties" | "Wards" | "System";
  method: "GET";
  path: string;
  summary: string;
  description: string;
  params?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example: string;
  }>;
  queryParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }>;
  responseType: "GeoJSON FeatureCollection" | "GeoJSON Feature" | "JSON Object" | "JSON Array";
  sampleResponse: unknown;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: "get-counties",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties",
    summary: "List all 47 Counties",
    description: "Returns a GeoJSON FeatureCollection of all 47 Kenyan county boundaries with PostGIS MultiPolygon geometries and properties.",
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "0",
          properties: { code: "KE001", name: "Mombasa" },
          geometry: { type: "MultiPolygon", coordinates: "[[[[39.64, -4.06], ...]]]]" }
        },
        {
          type: "Feature",
          id: "46",
          properties: { code: "KE047", name: "Nairobi" },
          geometry: { type: "MultiPolygon", coordinates: "[[[[36.82, -1.29], ...]]]]" }
        }
      ]
    }
  },
  {
    id: "get-county-by-slug",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug",
    summary: "Get County Boundary by Code",
    description: "Returns a single GeoJSON Feature representing the specified county boundary polygon.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "The county slug/code (e.g. KE047 for Nairobi, KE001 for Mombasa, KE042 for Kisumu)",
        example: "KE047"
      }
    ],
    responseType: "GeoJSON Feature",
    sampleResponse: {
      type: "Feature",
      id: "46",
      properties: { code: "KE047", name: "Nairobi" },
      geometry: { type: "MultiPolygon", coordinates: "[[[[36.82, -1.29], ...]]]]" }
    }
  },
  {
    id: "get-county-hierarchy",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/hierarchy",
    summary: "Get County Hierarchy & Constituencies",
    description: "High-performance endpoint returning the County code and name coupled with an array of its constituent constituencies, completely omitting heavy geometric coordinates.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047"
      }
    ],
    responseType: "JSON Object",
    sampleResponse: {
      county_code: "KE047",
      county_name: "Nairobi",
      constituencies: [
        { constituency_code: "274", constituency_name: "Westlands" },
        { constituency_code: "275", constituency_name: "Parklands/Highridge" },
        { constituency_code: "276", constituency_name: "Dagoretti North" },
        { constituency_code: "284", constituency_name: "Kibra" },
        { constituency_code: "285", constituency_name: "Roysambu" }
      ]
    }
  },
  {
    id: "get-county-constituencies",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/constituencies",
    summary: "Get Constituencies within a County",
    description: "Returns a GeoJSON FeatureCollection of all parliamentary electoral constituencies belonging to a specific county.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047"
      }
    ],
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "274",
          properties: { code: "274", name: "Westlands", county_code: "KE047" },
          geometry: { type: "MultiPolygon", coordinates: "..." }
        }
      ]
    }
  },
  {
    id: "get-county-subcounties",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/sub-counties",
    summary: "Get Sub-Counties in County",
    description: "Returns a lightweight JSON array describing all administrative sub-counties nested within the specified county.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047"
      }
    ],
    responseType: "JSON Object",
    sampleResponse: {
      sub_counties: [
        {
          county_code: "KE047",
          county_name: "Nairobi",
          sub_county_code: "4701",
          sub_county_name: "Westlands"
        },
        {
          county_code: "KE047",
          county_name: "Nairobi",
          sub_county_code: "4702",
          sub_county_name: "Dagoretti"
        }
      ]
    }
  },
  {
    id: "get-constituencies",
    category: "Constituencies",
    method: "GET",
    path: "/api/v1/constituencies",
    summary: "List all 290 Constituencies",
    description: "Returns a GeoJSON FeatureCollection of all 290 parliamentary electoral constituencies across Kenya.",
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "1",
          properties: { code: "001", name: "Changamwe", county_code: "KE001" },
          geometry: { type: "MultiPolygon", coordinates: "..." }
        }
      ]
    }
  },
  {
    id: "get-sub-counties",
    category: "Sub-Counties",
    method: "GET",
    path: "/api/v1/sub-counties",
    summary: "List all 412 Sub-Counties",
    description: "Returns a comprehensive JSON listing of all 412 national administrative sub-counties in Kenya.",
    responseType: "JSON Object",
    sampleResponse: {
      sub_counties: [
        {
          county_code: "KE001",
          county_name: "Mombasa",
          sub_county_code: "0101",
          sub_county_name: "Changamwe"
        }
      ]
    }
  },
  {
    id: "get-wards",
    category: "Wards",
    method: "GET",
    path: "/api/v1/wards",
    summary: "List 1,450 Wards (Paginated)",
    description: "Returns a paginated list of political wards throughout Kenya, including associated constituency and county metadata.",
    queryParams: [
      {
        name: "page",
        type: "integer",
        required: false,
        default: "1",
        description: "Page number for pagination"
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        default: "50",
        description: "Number of records per page (max 100)"
      }
    ],
    responseType: "JSON Array",
    sampleResponse: [
      {
        ward_code: "0001",
        ward_name: "Port Reitz",
        constituency_code: "001",
        county_code: "KE001"
      }
    ]
  },
  {
    id: "get-health",
    category: "System",
    method: "GET",
    path: "/health",
    summary: "System Health & Uptime",
    description: "Sanity health check verifying the API service is active and responsive.",
    responseType: "JSON Object",
    sampleResponse: {
      env: "development",
      status: "API is up and running!"
    }
  }
];

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    slug: "KE047",
    page: "1",
    limit: "10"
  });
  const [language, setLanguage] = useState<"curl" | "javascript" | "python" | "go">("curl");
  const [liveResponse, setLiveResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick pick counties for slug param
  const QUICK_SLUGS = [
    { code: "KE047", name: "Nairobi" },
    { code: "KE001", name: "Mombasa" },
    { code: "KE042", name: "Kisumu" },
    { code: "KE032", name: "Nakuru" },
    { code: "KE012", name: "Meru" },
    { code: "KE023", name: "Turkana" }
  ];

  const buildResolvedUrl = (endpoint: Endpoint) => {
    let resolved = endpoint.path;
    if (endpoint.params) {
      endpoint.params.forEach((p) => {
        const val = paramValues[p.name] || p.example;
        resolved = resolved.replace(`:${p.name}`, encodeURIComponent(val));
      });
    }

    if (endpoint.queryParams) {
      const q = new URLSearchParams();
      endpoint.queryParams.forEach((qp) => {
        const val = paramValues[qp.name] || qp.default;
        if (val) q.set(qp.name, val);
      });
      const qs = q.toString();
      if (qs) resolved += `?${qs}`;
    }

    return `http://localhost:18080${resolved}`;
  };

  const handleExecute = async () => {
    const url = buildResolvedUrl(selectedEndpoint);
    setLoading(true);
    setLiveResponse(null);
    setStatus(null);
    const start = performance.now();

    try {
      const res = await axios.get(url);
      setLatency(Math.round(performance.now() - start));
      setStatus(res.status);
      setLiveResponse(res.data);
    } catch (err: unknown) {
      setLatency(Math.round(performance.now() - start));
      if (axios.isAxiosError(err) && err.response) {
        setStatus(err.response.status);
        setLiveResponse(err.response.data);
      } else {
        setStatus(500);
        setLiveResponse({ error: "Failed to connect to API", message: String(err) });
      }
    } finally {
      setLoading(false);
    }
  };

  const getCodeSnippet = () => {
    const url = buildResolvedUrl(selectedEndpoint);

    switch (language) {
      case "curl":
        return `curl -X GET "${url}" \\\n  -H "Accept: application/json"`;

      case "javascript":
        return `// Using native fetch in Node 18+ or Browser\nconst response = await fetch("${url}", {\n  headers: { "Accept": "application/json" }\n});\nconst data = await response.json();\nconsole.log(data);`;

      case "python":
        return `import requests\n\nurl = "${url}"\nresponse = requests.get(url, headers={"Accept": "application/json"})\ndata = response.json()\nprint(data)`;

      case "go":
        return `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n)\n\nfunc main() {\n\tres, err := http.Get("${url}")\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer res.Body.Close()\n\tbody, _ := io.ReadAll(res.Body)\n\tfmt.Println(string(body))\n}`;
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar: Endpoints list grouped by category */}
      <div className="w-[320px] min-w-[320px] border-r border-border bg-card/60 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              API Reference v1
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Base URL: <code className="text-primary font-mono font-semibold">http://localhost:18080</code>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {(["Counties", "Constituencies", "Sub-Counties", "Wards", "System"] as const).map(
            (cat) => {
              const catEndpoints = ENDPOINTS.filter((e) => e.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {cat}
                  </div>
                  {catEndpoints.map((ep) => {
                    const active = selectedEndpoint.id === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setSelectedEndpoint(ep);
                          setLiveResponse(null);
                          setStatus(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between group ${
                          active
                            ? "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate text-xs">{ep.summary}</div>
                          <div className="text-[10px] font-mono text-muted-foreground truncate">
                            {ep.path}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {ep.method}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            }
          )}
        </div>

        {/* Footnote on Specs */}
        <div className="p-3 border-t border-border/80 bg-muted/20 text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>PostGIS + Redis 7 Acceleration</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Geometries rendered in standard WGS 84 (EPSG:4326) GeoJSON format with spatial GIST indexes.
          </p>
        </div>
      </div>

      {/* Main Endpoint Details & Interactive Console */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* Header Banner */}
        <div className="p-6 border-b border-border bg-card/20">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {selectedEndpoint.method}
            </span>
            <code className="text-base font-mono font-bold text-foreground">
              {selectedEndpoint.path}
            </code>
          </div>
          <h1 className="text-xl font-bold mt-2 text-foreground">
            {selectedEndpoint.summary}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            {selectedEndpoint.description}
          </p>
        </div>

        {/* Content Body: Split into documentation and interactive tester */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
          {/* Left Column: Parameters & Schemas */}
          <div className="space-y-6">
            {/* Parameters Section */}
            {selectedEndpoint.params && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  Path Parameters
                </h3>
                <div className="border border-border rounded-lg overflow-hidden bg-card/40">
                  {selectedEndpoint.params.map((p) => (
                    <div key={p.name} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-primary">
                            {p.name}
                          </code>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {p.type}
                          </span>
                          {p.required && (
                            <span className="text-[9px] bg-rose-500/10 text-rose-400 font-semibold px-1 py-0.5 rounded">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.description}</p>

                      {/* Quick pick buttons for county slugs */}
                      {p.name === "slug" && (
                        <div className="pt-2">
                          <span className="text-[10px] font-medium text-muted-foreground block mb-1.5">
                            Quick Select County:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_SLUGS.map((qs) => (
                              <button
                                key={qs.code}
                                onClick={() =>
                                  setParamValues((prev) => ({ ...prev, [p.name]: qs.code }))
                                }
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                  paramValues[p.name] === qs.code
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                                }`}
                              >
                                {qs.name} ({qs.code})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom Input */}
                      <div className="pt-1">
                        <input
                          type="text"
                          value={paramValues[p.name] || ""}
                          onChange={(e) =>
                            setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                          }
                          placeholder={`Example: ${p.example}`}
                          className="w-full text-xs font-mono px-3 py-1.5 rounded bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters Section */}
            {selectedEndpoint.queryParams && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  Query Parameters
                </h3>
                <div className="border border-border rounded-lg overflow-hidden bg-card/40 divide-y divide-border/60">
                  {selectedEndpoint.queryParams.map((qp) => (
                    <div key={qp.name} className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-primary">
                            {qp.name}
                          </code>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {qp.type}
                          </span>
                          {qp.default && (
                            <span className="text-[10px] text-muted-foreground">
                              default: <code className="font-mono">{qp.default}</code>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{qp.description}</p>
                      <input
                        type="text"
                        value={paramValues[qp.name] ?? qp.default ?? ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({ ...prev, [qp.name]: e.target.value }))
                        }
                        className="w-full text-xs font-mono px-3 py-1.5 rounded bg-background border border-border focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Snippets Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-primary" />
                  Code Examples
                </h3>
                <div className="flex gap-1 bg-muted p-0.5 rounded text-[10px]">
                  {(["curl", "javascript", "python", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-2 py-0.5 rounded font-mono uppercase font-semibold transition-all ${
                        language === lang
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-border bg-black/80">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/40">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {language}
                  </span>
                  <button
                    onClick={() => copyCode(getCodeSnippet())}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {getCodeSnippet()}
                </pre>
              </div>
            </div>
          </div>

          {/* Right Column: Live Test Console & Response Viewer */}
          <div className="space-y-6 flex flex-col">
            {/* Interactive Request Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Live API Console
                </h3>
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                >
                  <Send className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Fetching..." : "Send Request"}</span>
                </button>
              </div>

              {/* Resolved URL Preview */}
              <div className="p-2.5 rounded-lg border border-border bg-card/40 flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-muted-foreground truncate">
                  {buildResolvedUrl(selectedEndpoint)}
                </code>
                <span className="text-[10px] text-emerald-400 font-mono font-medium shrink-0">
                  ● Local API Ready
                </span>
              </div>
            </div>

            {/* Response Area */}
            <div className="flex-1 flex flex-col border border-border rounded-lg overflow-hidden bg-black/80 min-h-[350px]">
              {/* Header with status badges */}
              <div className="px-4 py-2.5 border-b border-border/40 bg-card/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-xs">Response</span>
                  {status !== null && (
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        status >= 200 && status < 300
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {status} OK
                    </span>
                  )}
                  {latency !== null && (
                    <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {latency}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {selectedEndpoint.responseType}
                  </span>
                  <button
                    onClick={() =>
                      copyCode(
                        JSON.stringify(
                          liveResponse || selectedEndpoint.sampleResponse,
                          null,
                          2
                        )
                      )
                    }
                    className="p-1 hover:text-foreground text-muted-foreground transition-colors"
                    title="Copy response JSON"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Response Body Viewer */}
              <div className="flex-1 p-4 overflow-auto max-h-[480px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground gap-2 py-12">
                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Executing spatial query against PostGIS...</span>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                    {JSON.stringify(
                      liveResponse || selectedEndpoint.sampleResponse,
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
