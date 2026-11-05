# Kenya Admin Boundaries API (v2.0)

A high-performance, cost-prudent geospatial REST engine and unified developer portal delivering administrative and electoral boundaries across Kenya down to the constituency and ward levels.

Engineered with Golang 1.25 Clean Architecture, PostGIS 3.3 2D GIST spatial indexing, in-process thread-safe LRU caching, standard-library sliding-window rate limiting, HTTP `Cache-Control` / `ETag` conditional revalidation, and a WCAG 2.1 AA compliant Developer Portal served directly from a single ~30MB container image.

---

## Architecture Highlights & Empirical Telemetry

* **Sub-20 MB Idle Stack Memory:** Reduced total system memory from **258.7 MiB down to 18.1 MiB** (a **93% reduction**), allowing deployment on budget VPS hosting (512MB RAM or free cloud tiers).
* **Two-Container Topology:** Streamlined production footprint from 4 containers down to 2 (`db` and `api`). Redis and pgAdmin have been completely eliminated.
* **Unified Single-Port Deployment:** The Go binary embeds and serves the compiled React 19 SPA with client-side routing fallback. The entire portal and API run on a single port (`:18080`).
* **In-Process Spatial Caching:** Thread-safe in-process cache with background TTL janitor. Spatial GeoJSON queries serve in **< 2ms** with zero network serialization overhead.
* **HTTP Conditional Revalidation:** RFC 7234 `Cache-Control` and SHA-256 `ETag` middleware. Repeat requests return `304 Not Modified` with **0 payload bytes**, saving megabytes of bandwidth.
* **47 Counties, 290 Constituencies, 412 Sub-Counties, 1,450 Wards:** Complete WGS 84 (EPSG:4326) polygons and hierarchical relations.

---

## Tech Stack & Architecture

### Backend & Unified Serving Engine

* **Language:** Golang 1.25 (Strict Clean Architecture: Domain, Repository, Service, and HTTP Handlers)
* **Web Framework:** Gin Web Framework
* **Spatial Database:** PostgreSQL 15 + PostGIS 3.3 (Memory-tuned: `shared_buffers=64MB`, `work_mem=4MB`)
* **In-Process Cache:** Thread-safe `sync.RWMutex` cache with 24h TTL and automated sweep (`internal/cache/memcache.go`)
* **Rate Limiting:** In-process sliding-window token bucket in pure Go standard library (`internal/middleware/rate_limiter.go`)
* **HTTP Caching:** Custom ETag generation with `If-None-Match` short-circuiting to `304 Not Modified`
* **Static Asset Serving:** Embedded React SPA static file server with client-side SPA fallback route
* **Type-Safe Queries:** `sqlc` for compile-time verified SQL execution
* **Migrations:** `golang-migrate` for version-controlled PostGIS schemas

### Frontend Developer Portal

* **Core:** React 19, TypeScript, Vite 7
* **API Configuration:** Dynamic `VITE_API_BASE_URL` defaulting to relative `/api/v1`
* **Styling & Design System:** Tailwind CSS v4 with a 3-tier design token scale, strict 8px spatial grid, and off-black surface layering (`#111216`, `#181920`, `#22242F`) to eliminate astigmatism halation
* **Mapping Engine:** Leaflet & React-Leaflet with multi-basemap support (Esri World Dark Canvas, OpenStreetMap Standard, Esri Satellite)
* **Accessibility:** WCAG 2.1 AA compliant semantic DOM landmarks, sequential heading hierarchy, and full keyboard `:focus-visible` navigation

---

## Repository Structure

```text
├── backend/
│   ├── cmd/api/main.go               # Dependency injection & HTTP server bootstrap
│   └── sql/queries.sql               # Raw SQL statements compiled by sqlc
├── internal/
│   ├── cache/                        # Thread-safe in-process memory cache implementation
│   ├── domain/                       # Core domain models (County, Constituency, SubCounty, Ward)
│   ├── handler/                      # HTTP transport layer, static asset serving & Gin routes
│   ├── middleware/                   # Rate limiter, HTTP ETag cache & CORS middleware
│   ├── repository/postgres/          # sqlc-generated type-safe PostgreSQL/PostGIS repositories
│   └── service/                      # Business logic & caching interfaces
├── frontend/                         # React 19 Developer Portal & Map Explorer
│   ├── src/
│   │   ├── components/               # Modular presentation components (Landing, Map, Sidebar)
│   │   ├── data/                     # Centralized content & API endpoint specifications (DRY)
│   │   └── views/                    # Top-level route orchestrators (LandingPage, ApiDocs, Playground)
├── docs/
│   ├── adr/                          # Architecture Decision Records (ADR 0000 - 0008)
│   ├── baseline/                     # Empirical benchmark files, load tests, and memory stats
│   ├── history/                      # Historical v1 architecture documentation
│   └── PROJECT_ARCHITECTURE.md       # Definitive v2 technical architecture document
├── migrations/                       # PostGIS database schema migrations
├── Dockerfile                        # 3-stage multi-stage build (Node 22 + Go 1.25 + Alpine 3.20)
├── docker-compose.yml                # Production orchestration definitions (db + api)
└── docker-compose.override.yml       # Local development port mapping & volume overrides
```

---

## Getting Started

### Prerequisites

* Docker & Docker Compose (v2.20+)
* Optional: Node.js 20+ and Go 1.25+ (only for local development outside Docker)

### 1. Launch the Entire Stack via Docker

Build the unified multi-stage container and start PostGIS and the API with a single command:

```bash
docker compose up -d --build
```

Verify service status:

* **Developer Portal (Web UI):** `http://localhost:18080/`
* **API Documentation & Console:** `http://localhost:18080/docs`
* **Geospatial Map Explorer:** `http://localhost:18080/map`
* **API Health Check:** `http://localhost:18080/health`
* **API Route Index:** `http://localhost:18080/__routes`

Check the memory footprint:

```bash
docker stats --no-stream
```
*(Total memory consumption across both containers is ~18 MiB at idle!)*

### 2. Local Development (Optional)

If running outside Docker:

```bash
# Start PostGIS
docker compose up -d db

# Run Go backend (serves API and local frontend dist)
go run ./backend/cmd/api/main.go

# Or run Vite HMR dev server for frontend development
cd frontend && npm install && npm run dev
```

---

## API Reference

Base URL: `http://localhost:18080/api/v1`

| Method | Endpoint | Description | Output Format | Cache Headers |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/counties` | Returns all 47 counties with full spatial polygons | GeoJSON FeatureCollection | `ETag`, `Cache-Control` |
| `GET` | `/counties/:slug` | Returns a single county boundary polygon | GeoJSON Feature | `ETag`, `Cache-Control` |
| `GET` | `/counties/:slug/hierarchy` | Lightweight county details and constituency names (no heavy geometries) | JSON Object | `ETag`, `Cache-Control` |
| `GET` | `/counties/:slug/constituencies` | All electoral constituencies in a county | GeoJSON FeatureCollection | `ETag`, `Cache-Control` |
| `GET` | `/counties/:slug/sub-counties` | All administrative sub-counties in a county | JSON Array | `ETag`, `Cache-Control` |
| `GET` | `/constituencies` | Returns all 290 national parliamentary constituencies | GeoJSON FeatureCollection | `ETag`, `Cache-Control` |
| `GET` | `/sub-counties` | Returns all 412 national administrative sub-counties | JSON Array | `ETag`, `Cache-Control` |
| `GET` | `/wards` | Returns paginated electoral wards (`?page=1&limit=50`) | JSON Array | `ETag`, `Cache-Control` |
| `GET` | `/health` | System uptime, memory stats, and database connectivity | JSON Object | None |

---

## Verification & Automated Testing

```bash
# Run all Go tests with a 60s timeout
go test ./... -timeout 60s

# Verify frontend TypeScript build
npm --prefix frontend run build

# Verify conditional HTTP caching (304 Not Modified)
ETAG=$(curl -s -I http://localhost:18080/api/v1/counties | grep -i etag | tr -d '\r' | awk '{print $2}')
curl -I -H "If-None-Match: $ETAG" http://localhost:18080/api/v1/counties
```

---

## Architecture Decision Records (ADRs)

Detailed records of all design choices, discarded alternatives, and empirical benchmarks are archived in [`docs/adr/`](docs/adr/):

* **[ADR 0000: Architecture Decision Record Methodology](docs/adr/0000-record-architecture-decisions.md)**
* **[ADR 0001: Baseline Measurements (v1.0-redis-pgadmin)](docs/adr/0001-baseline-v1-measurements.md)**
* **[ADR 0002: In-Process GeoJSON Caching](docs/adr/0002-in-process-geojson-cache.md)**
* **[ADR 0003: In-Process Rate Limiter & Redis Elimination](docs/adr/0003-eliminate-redis.md)**
* **[ADR 0004: HTTP Caching & ETag Conditional Validation](docs/adr/0004-http-caching-etag-support.md)**
* **[ADR 0005: Configurable Frontend API URL](docs/adr/0005-configurable-frontend-api-url.md)**
* **[ADR 0006: Database Memory Tuning & Removal of pgAdmin](docs/adr/0006-remove-pgadmin-tune-postgres.md)**
* **[ADR 0007: Multi-Stage Dockerfile & Unified Single-Container Application](docs/adr/0007-unified-container-spa-serving.md)**
* **[ADR 0008: Final Architectural Assessment & v1 vs v2 Empirical Comparison](docs/adr/0008-v1-vs-v2-final-comparison.md)**

For a complete deep-dive into platform topology, spatial indexing, and frontend design tokens, see **[docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md)**.
