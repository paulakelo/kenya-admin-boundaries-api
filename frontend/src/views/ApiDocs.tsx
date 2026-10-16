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
      <aside aria-label="API Endpoints Navigation" className="w-80 min-w-80 border-r border-border-subtle bg-surface-raised flex flex-col h-full overflow-hidden">
        <header className="p-4 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                API Reference v1
              </span>
            </div>
            <nav aria-label="Quick links" className="flex items-center gap-2 text-xs font-mono">
              <Link
                to="/"
                className="text-text-muted hover:text-accent transition-colors flex items-center gap-1 text-xs focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                title="Back to Overview"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                <span>Home</span>
              </Link>
              <span className="text-text-muted/30" aria-hidden="true">•</span>
              <Link
                to="/map"
                className="text-text-muted hover:text-accent transition-colors flex items-center gap-1 text-xs focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                title="Open Map Explorer"
              >
                <MapIcon className="h-3 w-3" aria-hidden="true" />
                <span>Map</span>
              </Link>
            </nav>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Base URL: <code className="text-accent font-mono font-semibold">http://localhost:18080</code>
          </p>
        </header>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {(["Counties", "Constituencies", "Sub-Counties", "Wards", "System"] as const).map(
            (cat) => {
              const catEndpoints = ENDPOINTS.filter((e) => e.category === cat);
              return (
                <div key={cat} className="space-y-1">
                  <div className="px-2 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
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
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between group cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                          active
                            ? "bg-surface-overlay text-text-heading font-semibold border border-accent/40 shadow-xs"
                            : "text-text-body hover:bg-surface-overlay hover:text-text-heading border border-transparent"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate text-xs font-medium">{ep.summary}</div>
                          <div className="text-xs font-mono text-text-muted truncate">
                            {ep.path}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
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
        <footer className="p-3 border-t border-border-subtle bg-surface-base text-xs text-text-muted space-y-1">
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
        <header className="p-6 border-b border-border-subtle bg-surface-raised">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {selectedEndpoint.method}
            </span>
            <code className="text-base font-mono font-bold text-text-heading">
              {selectedEndpoint.path}
            </code>
          </div>
          <h1 className="text-xl font-bold mt-2 text-text-heading">
            {selectedEndpoint.summary}
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-3xl leading-relaxed">
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
                <h2 id="path-params-heading" className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Path Parameters
                </h2>
                <div className="border border-border-subtle rounded-lg overflow-hidden bg-surface-raised">
                  {selectedEndpoint.params.map((p) => (
                    <div key={p.name} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-accent">
                            {p.name}
                          </code>
                          <span className="text-xs text-text-muted font-mono">
                            {p.type}
                          </span>
                          {p.required && (
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 font-semibold px-1 py-0.5 rounded border border-rose-500/20">
                              required
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">{p.description}</p>

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
                                    ? "bg-accent text-accent-contrast font-semibold border-accent"
                                    : "bg-surface-base text-text-muted border-border-subtle hover:text-text-heading hover:bg-surface-overlay"
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
                          className="w-full text-xs font-mono px-3 py-1.5 rounded bg-surface-sunken border border-border-subtle text-text-heading focus:ring-1 focus:ring-accent focus:outline-none"
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
                <h2 id="query-params-heading" className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Query Parameters
                </h2>
                <div className="border border-border-subtle rounded-lg overflow-hidden bg-surface-raised divide-y divide-border-subtle">
                  {selectedEndpoint.queryParams.map((qp) => (
                    <div key={qp.name} className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-accent">
                            {qp.name}
                          </code>
                          <span className="text-xs text-text-muted font-mono">
                            {qp.type}
                          </span>
                          {qp.default && (
                            <span className="text-xs text-text-muted">
                              default: <code className="font-mono">{qp.default}</code>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">{qp.description}</p>
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
                        className="w-full text-xs font-mono px-3 py-1.5 rounded bg-surface-sunken border border-border-subtle text-text-heading focus:ring-1 focus:ring-accent focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Code Snippets Section */}
            <section aria-labelledby="code-snippets-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="code-snippets-heading" className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Code Examples
                </h2>
                <div role="tablist" aria-label="Code language selectors" className="flex gap-1 bg-surface-sunken p-1 rounded border border-border-subtle text-xs">
                  {(["curl", "javascript", "python", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      role="tab"
                      aria-selected={language === lang}
                      onClick={() => setLanguage(lang)}
                      className={`px-2 py-0.5 rounded font-mono uppercase font-semibold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                        language === lang
                          ? "bg-surface-raised text-text-heading shadow-xs"
                          : "text-text-muted hover:text-text-heading"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg overflow-hidden border border-border-subtle bg-surface-sunken">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-raised">
                  <span className="text-xs font-mono text-text-muted uppercase">
                    {language}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(getCodeSnippet())}
                    aria-label={copied ? "Code copied to clipboard" : "Copy code snippet"}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-heading transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm px-1"
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
                <pre className="p-4 text-xs font-mono text-text-body overflow-x-auto leading-relaxed">
                  {getCodeSnippet()}
                </pre>
              </div>
            </section>
          </div>

          {/* Right Column: Live Test Console & Response Viewer */}
          <div className="space-y-6 flex flex-col">
            {/* Interactive Request Bar */}
            <section aria-labelledby="live-console-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 id="live-console-heading" className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Live API Console
                </h2>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading}
                  aria-label="Send API request"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-contrast text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Send className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                  <span>{loading ? "Fetching..." : "Send Request"}</span>
                </button>
              </div>

              {/* Resolved URL Preview */}
              <div className="p-3 rounded-lg border border-border-subtle bg-surface-raised flex items-center justify-between gap-2">
                <code className="text-xs font-mono text-text-muted truncate">
                  {buildResolvedUrl(selectedEndpoint)}
                </code>
                <span className="text-xs text-emerald-400 font-mono font-medium shrink-0">
                  ● Ready
                </span>
              </div>
            </section>

            {/* Response Area */}
            <article aria-labelledby="response-viewer-heading" className="flex-1 flex flex-col border border-border-subtle rounded-lg overflow-hidden bg-surface-sunken min-h-[350px]">
              {/* Header with status badges */}
              <header className="px-4 py-2.5 border-b border-border-subtle bg-surface-raised flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <h3 id="response-viewer-heading" className="font-semibold text-text-heading text-xs">
                    Response
                  </h3>
                  {status !== null && (
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        status >= 200 && status < 300
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {status} OK
                    </span>
                  )}
                  {latency !== null && (
                    <span className="flex items-center gap-1 font-mono text-xs text-text-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {latency}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-mono">
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
                    className="p-1 text-text-muted hover:text-text-heading transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                    title="Copy response JSON"
                    aria-label="Copy response JSON"
                  >
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </header>

              {/* Response Body Viewer */}
              <div className="flex-1 p-4 overflow-auto max-h-[480px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-xs text-text-muted gap-2 py-12">
                    <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true" />
                    <span>Executing spatial query against PostGIS...</span>
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
