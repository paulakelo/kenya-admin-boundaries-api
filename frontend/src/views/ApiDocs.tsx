import { useState } from "react";
import { Link } from "react-router-dom";
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
  ArrowLeft,
  Map as MapIcon,
} from "lucide-react";
import { ENDPOINTS } from "../data/apiEndpoints";
import type { Endpoint } from "../data/apiEndpoints";

export default function ApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    slug: "KE047",
    page: "1",
    limit: "10",
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
    { code: "KE023", name: "Turkana" },
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
        return `// Native Fetch (Node 18+ or modern browser)\nconst response = await fetch("${url}", {\n  headers: { "Accept": "application/json" }\n});\nconst data = await response.json();\nconsole.log(data);`;

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
    <div className="flex h-full w-full overflow-hidden bg-surface-base text-text-body font-sans">
      {/* Sidebar: Endpoints list grouped by category */}
      <aside aria-label="API Endpoints Navigation" className="w-80 min-w-80 border-r border-border-strong bg-surface-sunken flex flex-col h-full overflow-hidden">
        <header className="p-4 border-b border-border-strong bg-surface-base">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-heading">
                API Reference v1
              </span>
            </div>
            <nav aria-label="Quick links" className="flex items-center gap-2 text-xs font-mono">
              <Link
                to="/"
                className="text-text-muted hover:text-accent transition-colors flex items-center gap-1 text-xs focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1 py-0.5"
                title="Back to Overview"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                <span>Home</span>
              </Link>
              <span className="text-border-strong" aria-hidden="true">•</span>
              <Link
                to="/map"
                className="text-text-muted hover:text-accent transition-colors flex items-center gap-1 text-xs focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1 py-0.5"
                title="Open Map Explorer"
              >
                <MapIcon className="h-3 w-3" aria-hidden="true" />
                <span>Map</span>
              </Link>
            </nav>
          </div>
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
            <span>Base URL:</span>
            <code className="text-accent font-mono font-semibold bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">
              http://localhost:18080
            </code>
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {(["Counties", "Constituencies", "Sub-Counties", "Wards", "System"] as const).map(
            (cat) => {
              const catEndpoints = ENDPOINTS.filter((e) => e.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2.5 py-1 text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
                    <span>{cat}</span>
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
                        className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition-colors flex items-center justify-between group cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                          active
                            ? "bg-surface-overlay text-text-heading font-semibold border-l-2 border-l-accent border-y border-r border-border-strong shadow-xs"
                            : "text-text-body hover:bg-surface-raised hover:text-text-heading border border-transparent"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate text-xs font-medium">{ep.summary}</div>
                          <div className="text-xs font-mono text-text-muted truncate">
                            {ep.path}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
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

        {/* Specifications Footnote */}
        <footer className="p-3 border-t border-border-strong bg-surface-base text-xs text-text-muted space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-text-heading">
            <Database className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>PostGIS + Redis 7 Acceleration</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Geometries rendered in standard WGS 84 (EPSG:4326) GeoJSON with 2D GIST spatial indexing.
          </p>
        </footer>
      </aside>

      {/* Main Endpoint Details & Interactive Console */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-surface-base">
        {/* Header Banner */}
        <header className="p-6 border-b border-border-strong bg-surface-raised shadow-xs">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {selectedEndpoint.method}
            </span>
            <code className="text-base font-mono font-bold text-text-heading bg-surface-sunken px-2.5 py-1 rounded border border-border-subtle">
              {selectedEndpoint.path}
            </code>
          </div>
          <h1 className="text-xl font-bold mt-3 text-text-heading">
            {selectedEndpoint.summary}
          </h1>
          <p className="text-xs text-text-muted mt-1.5 max-w-3xl leading-relaxed">
            {selectedEndpoint.description}
          </p>
        </header>

        {/* Content Body: Documentation & Interactive Playground */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
          {/* Left Column: Parameters & Schemas */}
          <div className="space-y-6">
            {/* Parameters Section */}
            {selectedEndpoint.params && (
              <section aria-labelledby="path-params-heading" className="space-y-3">
                <h2 id="path-params-heading" className="text-xs font-bold uppercase tracking-wider text-text-heading flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Path Parameters
                </h2>
                <div className="border border-border-strong rounded-lg overflow-hidden bg-surface-raised shadow-xs">
                  {selectedEndpoint.params.map((p) => (
                    <div key={p.name} className="p-4 space-y-2.5 border-b border-border-subtle last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-accent bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">
                            {p.name}
                          </code>
                          <span className="text-xs text-text-muted font-mono">
                            {p.type}
                          </span>
                          {p.required && (
                            <span className="text-[10px] bg-rose-500/15 text-rose-300 font-semibold px-1.5 py-0.5 rounded border border-rose-500/30">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{p.description}</p>

                      {/* Quick pick buttons for county slugs */}
                      {p.name === "slug" && (
                        <div className="pt-2">
                          <span className="text-xs font-medium text-text-muted block mb-1.5">
                            Quick Select County:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {QUICK_SLUGS.map((qs) => (
                              <button
                                key={qs.code}
                                type="button"
                                onClick={() =>
                                  setParamValues((prev) => ({ ...prev, [p.name]: qs.code }))
                                }
                                className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                                  paramValues[p.name] === qs.code
                                    ? "bg-accent text-black font-bold border-accent shadow-xs"
                                    : "bg-surface-sunken text-text-body border-border-subtle hover:text-text-heading hover:border-border-strong"
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
                        <label htmlFor={`param-${p.name}`} className="sr-only">
                          Value for {p.name}
                        </label>
                        <input
                          id={`param-${p.name}`}
                          type="text"
                          value={paramValues[p.name] || ""}
                          onChange={(e) =>
                            setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                          }
                          placeholder={`Example: ${p.example}`}
                          className="w-full text-xs font-mono px-3 py-2 rounded-md bg-surface-sunken border border-border-strong text-text-heading placeholder:text-text-muted/50 focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Query Parameters Section */}
            {selectedEndpoint.queryParams && (
              <section aria-labelledby="query-params-heading" className="space-y-3">
                <h2 id="query-params-heading" className="text-xs font-bold uppercase tracking-wider text-text-heading flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Query Parameters
                </h2>
                <div className="border border-border-strong rounded-lg overflow-hidden bg-surface-raised divide-y divide-border-subtle shadow-xs">
                  {selectedEndpoint.queryParams.map((qp) => (
                    <div key={qp.name} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-accent bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">
                            {qp.name}
                          </code>
                          <span className="text-xs text-text-muted font-mono">
                            {qp.type}
                          </span>
                          {qp.default && (
                            <span className="text-xs text-text-muted">
                              default: <code className="font-mono bg-surface-sunken px-1 rounded">{qp.default}</code>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed">{qp.description}</p>
                      <label htmlFor={`query-${qp.name}`} className="sr-only">
                        Value for {qp.name}
                      </label>
                      <input
                        id={`query-${qp.name}`}
                        type="text"
                        value={paramValues[qp.name] ?? qp.default ?? ""}
                        onChange={(e) =>
                          setParamValues((prev) => ({ ...prev, [qp.name]: e.target.value }))
                        }
                        className="w-full text-xs font-mono px-3 py-2 rounded-md bg-surface-sunken border border-border-strong text-text-heading placeholder:text-text-muted/50 focus:ring-1 focus:ring-accent focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Code Snippets Section */}
            <section aria-labelledby="code-snippets-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="code-snippets-heading" className="text-xs font-bold uppercase tracking-wider text-text-heading flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Code Examples
                </h2>
                <div role="tablist" aria-label="Code language selectors" className="flex gap-1 bg-surface-sunken p-1 rounded-md border border-border-strong text-xs">
                  {(["curl", "javascript", "python", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      role="tab"
                      aria-selected={language === lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-2.5 py-1 rounded font-mono uppercase font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                        language === lang
                          ? "bg-surface-raised text-accent border border-border-subtle shadow-xs"
                          : "text-text-muted hover:text-text-heading"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-border-strong bg-surface-sunken shadow-xs">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-strong bg-surface-overlay">
                  <span className="text-xs font-mono text-text-muted uppercase font-semibold">
                    {language}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(getCodeSnippet())}
                    aria-label={copied ? "Code copied to clipboard" : "Copy code snippet"}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-heading transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded px-1.5 py-0.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                        <span className="text-accent font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
                  {getCodeSnippet()}
                </pre>
              </div>
            </section>
          </div>

          {/* Right Column: Live Test Console & Response Viewer */}
          <div className="space-y-6 flex flex-col">
            {/* Interactive Request Bar */}
            <section aria-labelledby="live-console-heading" className="space-y-3">
              <h2 id="live-console-heading" className="text-xs font-bold uppercase tracking-wider text-text-heading flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Live API Console
              </h2>

              {/* Resolved URL Preview & High-Visibility Send Request Trigger */}
              <div className="p-2.5 rounded-lg border border-border-strong bg-surface-raised flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 bg-surface-sunken rounded-md border border-border-subtle">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {selectedEndpoint.method}
                  </span>
                  <code className="text-xs font-mono text-text-heading truncate flex-1 select-all">
                    {buildResolvedUrl(selectedEndpoint)}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading}
                  aria-label="Send API request"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-accent text-black font-bold text-xs uppercase tracking-wider hover:bg-lime-300 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all shrink-0"
                >
                  <Send className={`h-3.5 w-3.5 ${loading ? "animate-spin text-black" : "text-black"}`} aria-hidden="true" />
                  <span>{loading ? "Sending..." : "Send Request"}</span>
                </button>
              </div>
            </section>

            {/* Response Area */}
            <article aria-labelledby="response-viewer-heading" className="flex-1 flex flex-col border border-border-strong rounded-lg overflow-hidden bg-surface-sunken min-h-[400px] shadow-xs">
              {/* Header with status badges */}
              <header className="px-4 py-2.5 border-b border-border-strong bg-surface-overlay flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <h3 id="response-viewer-heading" className="font-bold text-text-heading text-xs">
                    Response
                  </h3>
                  {status !== null && (
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        status >= 200 && status < 300
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      }`}
                    >
                      {status} OK
                    </span>
                  )}
                  {latency !== null && (
                    <span className="flex items-center gap-1 font-mono text-xs text-text-muted bg-surface-sunken px-1.5 py-0.5 rounded border border-border-subtle">
                      <Clock className="h-3 w-3 text-accent" aria-hidden="true" />
                      {latency}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-mono bg-surface-sunken px-2 py-0.5 rounded border border-border-subtle">
                    {selectedEndpoint.responseType}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyCode(
                        JSON.stringify(
                          liveResponse || selectedEndpoint.sampleResponse,
                          null,
                          2
                        )
                      )
                    }
                    className="p-1.5 text-text-muted hover:text-text-heading transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded bg-surface-sunken border border-border-subtle hover:border-border-strong"
                    title="Copy response JSON"
                    aria-label="Copy response JSON"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </header>

              {/* Response Body Viewer */}
              <div className="flex-1 p-4 overflow-auto max-h-[520px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted gap-2 py-16">
                    <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true" />
                    <span className="font-mono">Executing spatial query against PostGIS...</span>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-text-body leading-relaxed">
                    {JSON.stringify(
                      liveResponse || selectedEndpoint.sampleResponse,
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}
