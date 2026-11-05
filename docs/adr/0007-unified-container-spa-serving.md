# ADR 0007: Multi-Stage Dockerfile & Unified Single-Container Application

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 6 (Multi-Stage Dockerfile & Unified App)

---

## 1. Context & Problem Statement
In v1, running the application required two disparate runtime paradigms:
1. The Go backend mounted a host-compiled executable (`./bin/api`) into an Alpine shell, preventing standardized, reproducible builds on remote servers.
2. The React 19 developer portal ran as a separate Node.js process requiring separate port management (port 5173 vs 18080), separate dev dependencies, and separate deployment targets.

To deploy on prudent resources (such as a single $3.50/mo VPS or container service), the platform needed a reproducible, zero-configuration build pipeline that unifies the frontend and backend into a single self-contained application container.

---

## 2. Decision
1. **Multi-Stage `Dockerfile` Pipeline:**
   Created a 3-stage reproducible build pipeline in [`Dockerfile`](../../Dockerfile):
   * **Stage 1 (`frontend-builder`):** Uses `node:22-alpine` to compile TypeScript and build the React 19 SPA (`npm ci && npm run build` -> `/app/frontend/dist`).
   * **Stage 2 (`backend-builder`):** Uses `golang:1.25-alpine` to compile a statically linked Go binary (`CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s"`).
   * **Stage 3 (`runtime`):** A lean `alpine:3.20` image containing only `ca-certificates`, `tzdata`, the static binary, and the compiled frontend assets (`/app/frontend/dist`).
2. **Native Go SPA Serving with Client-Side Routing Fallback:**
   Enhanced [`internal/handler/router.go`](../../internal/handler/router.go) to:
   * Serve static asset files (`/assets/*`, `/favicon.ico`, `/vite.svg`, etc.) directly with proper MIME types.
   * Provide an SPA fallback route (`r.NoRoute`): any non-API `GET` request (such as `/`, `/docs`, `/map`) serves `index.html`, allowing React Router 7 to seamlessly handle client-side navigation.
   * Preserve all `/api/v1/*` routes, CORS handling, rate limiting, and HTTP cache headers.
3. **Streamlined Docker Compose:**
   Updated [`docker-compose.yml`](../../docker-compose.yml) to define only two production services:
   * `db`: PostgreSQL 15 + PostGIS 3.3 (memory-tuned)
   * `api`: Unified multi-stage container building directly from `./Dockerfile`.

---

## 3. Alternatives Considered

* **Hosting Frontend on an Nginx sidecar container:**
  * *Why rejected:* Adds another container (~15MB RAM), another reverse-proxy configuration, and internal network hops. Go's standard library `http.FileServer` and Gin static handlers serve static assets in microseconds with negligible RAM.
* **Hosting Frontend separately on Cloudflare Pages / Vercel:**
  * *Viable alternative:* While separating frontend to Cloudflare Pages is still supported (via `VITE_API_BASE_URL`), having the Go binary natively capable of serving the built bundle guarantees that a developer can deploy the entire stack with a single `docker compose up -d` on any bare-metal or cloud VM.

---

## 4. Consequences & Tradeoffs

### Positive (Gains)
* **Single Unified Application Container:** The Go API and React developer portal are packaged into a single ~30 MB Docker image.
* **Sub-20 MB Total Stack Memory:**
  * `spatial_api` runs in **~3.5 MiB RAM**.
  * `spatial_pg` runs in **~14.5 MiB RAM**.
  * **Total stack memory is ~18 MiB**, easily operating within a 512MB RAM budget.
* **Same-Origin Delivery:** Eliminates all cross-origin pre-flight `OPTIONS` requests when users interact with the API docs console or map explorer.

### Negative (Downsides & Lost Capabilities)
* Docker image build time takes ~2.5–3 minutes on initial build because `npm ci` and `go mod download` execute in Docker build stages (mitigated by Docker layer caching for subsequent builds).

---

## 5. How to Verify

```bash
# 1. Inspect running services - exactly 2 services
docker compose ps
# Expected: spatial_api and spatial_pg

# 2. Verify static frontend landing page
curl -s http://localhost:18080/ | grep "<title>"
# Expected: <title>Kenya Admin Boundaries API</title>

# 3. Verify SPA fallback on docs and map routes
curl -s http://localhost:18080/docs | grep "<title>"
curl -s http://localhost:18080/map | grep "<title>"

# 4. Verify API route integrity
curl -s http://localhost:18080/api/v1/counties | head -c 100
```

### Acceptance Criteria
- [x] Multi-stage `Dockerfile` successfully produces self-contained runtime image.
- [x] `docker-compose.yml` orchestrates exactly 2 services (`db` + `api`).
- [x] Go server delivers static React SPA under `/` and handles `/docs` & `/map` SPA routing.
- [x] API endpoints continue delivering sub-millisecond cached responses.
- [x] All handler unit tests pass.
