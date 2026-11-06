# ADR 0005: Decouple Frontend via Environment-Aware API Base URL

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 4 (Frontend API URL Decoupling)

---

## 1. Context & Problem Statement

In v1, several core views in the React 19 + Vite frontend ([`Sidebar.tsx`](../../frontend/src/components/Sidebar.tsx), [`Playground.tsx`](../../frontend/src/views/Playground.tsx), and [`ApiDocs.tsx`](../../frontend/src/views/ApiDocs.tsx)) had `http://localhost:18080` hardcoded into their network request logic.

This rigid coupling caused several issues:
1. **Broken Remote Deployment:** Deploying the frontend to a remote host (e.g. Cloudflare Pages, Vercel, or an origin server) caused browser requests to fail as the client attempted to connect to the visitor's local machine on port 18080.
2. **CORS Restrictions:** Hardcoding an absolute host forced all API requests across separate origins, requiring cross-origin resource sharing (CORS) negotiation and OPTIONS pre-flight overhead.
3. **Environment Inflexibility:** Staging, production, and Dockerized environments could not override the API target without rewriting source code.

---

## 2. Decision

1. **Adopt `VITE_API_BASE_URL` with Relative Default:**
   Replaced all hardcoded `http://localhost:18080` references with Vite's client-side environment variable standard:
   ```ts
   const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
   ```
2. **Same-Origin First Strategy:**
   When `VITE_API_BASE_URL` is omitted, the frontend defaults to relative paths (`/api/v1`). When the frontend bundle is served by the same origin (such as the Go API server or a reverse proxy), requests are same-origin by default, eliminating CORS latency.
3. **Dynamic Documentation Display:**
   The interactive API test console in `ApiDocs.tsx` dynamically displays `window.location.origin` or the configured environment URL rather than a static localhost label.

---

## 3. Alternatives Considered

* **Hardcoding production domain (e.g. `https://api.kenya-boundaries.ke`):**
  * *Why rejected:* Replaces one hardcoded environment with another; breaks local development and staging environments.
* **Runtime config injected via `window.__ENV__`:**
  * *Why rejected:* Adds HTML templating requirements and breaks static SPA edge hosting (e.g. Cloudflare Pages, GitHub Pages).

---

## 4. Consequences & Tradeoffs

### Positive (Gains)

* **Portable Frontend Artifacts:** The built bundle (`frontend/dist`) can be deployed to any static host (Cloudflare Pages, S3, Netlify) or served directly by the Go backend.
* **Zero CORS Overhead when Co-Hosted:** Using same-origin relative URLs (`/api/v1`) avoids HTTP `OPTIONS` pre-flight requests.
* **Full Build Verification:** TypeScript compilation (`tsc -b`) and Vite production bundle pass without errors.

### Negative (Downsides & Lost Capabilities)

* If running Vite in local standalone development (`npm run dev` on port 5173) without setting `VITE_API_BASE_URL`, relative requests to `/api/v1` require Vite proxy configuration or setting `VITE_API_BASE_URL=http://localhost:18080/api/v1`.

---

## 5. How to Verify

```bash
# 1. Run frontend lint and build
npm --prefix frontend run lint
npm --prefix frontend run build

# 2. Check that no localhost:18080 references remain in frontend/src
grep -rn "18080" frontend/src/
# Expected: no operational matches (only sample cURL snippet in portalContent if desired)
```

### Acceptance Criteria

- [x] Hardcoded `http://localhost:18080` replaced with `VITE_API_BASE_URL` in `Sidebar.tsx`, `Playground.tsx`, and `ApiDocs.tsx`.
- [x] Frontend builds cleanly with zero errors.
- [x] Relative `/api/v1` default enables same-origin hosting.
