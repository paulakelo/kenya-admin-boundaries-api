# ADR 0008: Final Architectural Assessment & v1 vs v2 Empirical Comparison

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 7 (Final Measurements & Architecture Documentation)

---

## 1. Context & Objective

The Kenya Administrative Boundaries API is a spatial data service delivering administrative and electoral boundary polygons across Kenya (~2,200 records: 47 counties, 290 constituencies, 412 sub-counties, 1,450 wards; ~35 MB total database footprint). The dataset is fundamentally **read-only reference data** that changes approximately once a decade with national census or constituency boundary reviews.

Despite the modest, static nature of the dataset, the original v1 architecture was burdened with unnecessary infrastructure complexity:
* An auxiliary **Redis 7** container solely for caching GeoJSON strings and fixed-window IP rate limiting.
* A heavy **pgAdmin** container consuming nearly 70% of total system memory.
* Hardcoded `localhost:18080` API endpoints in the React frontend.
* No HTTP caching semantics (ETag / Cache-Control), causing clients to download multi-megabyte GeoJSON polygons repeatedly.
* A fragmented deployment model requiring separate processes and ports for the frontend portal and the backend API.

The goal of this refactor was to prune away all extraneous moving parts and produce a **lean, self-contained, cost-prudent architecture** capable of running reliably on a budget VPS (e.g. 512 MB – 1 GB RAM, or free cloud tiers) while improving response latency, throughput, and developer experience.

---

## 2. Comprehensive Before & After Comparison

| Architectural Dimension | Version 1 (Baseline - Tag `v1.0-redis-pgadmin`) | Version 2 (Lean - Tag `v2.0`) | Impact / Savings |
| :--- | :--- | :--- | :--- |
| **Active Containers** | 4 containers (`spatial_pg`, `redis`, `pgadmin`, `spatial_api` dev) | 2 containers (`db`, `api`) | **-50% container overhead** |
| **Idle Memory Footprint** | **258.7 MiB** (`pgadmin`: 177.5M, `pg`: 47.9M, `redis`: 17.5M, `api`: 15.8M) | **18.1 MiB** (`db`: 14.5M, `api`: 3.6M) | **93.0% RAM reduction (-240.6 MiB)** |
| **Peak Memory Under Load** | **289.3 MiB** | **119.1 MiB** (includes full in-memory cache) | **58.8% RAM reduction (-170.2 MiB)** |
| **GeoJSON Caching** | Remote Redis 7 container over TCP socket | In-process thread-safe LRU cache with TTL janitor | Zero serialization/socket overhead; 1-2ms lookup |
| **Rate Limiting** | Redis INCR + EXPIRE via network round-trip | In-process thread-safe sliding window with memory sweep | Zero external dependencies; 100% Go stdlib |
| **External Dependencies** | `github.com/redis/go-redis/v9` + Redis daemon | Standard library only (`sync`, `crypto/sha256`) | Purged Redis from `go.mod` and Docker stack |
| **HTTP Caching & Revalidation**| None (Clients re-downloaded 2.94 MB every request) | `Cache-Control: public, max-age=86400` + SHA-256 `ETag` (304) | **100% bandwidth savings (0 bytes body on revalidation)** |
| **Frontend Integration** | Hardcoded `http://localhost:18080`, separate dev server | `VITE_API_BASE_URL` with relative `/api/v1` fallback | Deployable behind any domain/CDN or same-origin |
| **Frontend Serving** | Unpackaged / manual Vite dev server (:5173) | Go binary serves compiled SPA with client-side routing fallback | Single unified port (:18080) for API + Web Portal |
| **Build Reproducibility** | Relied on host-compiled `./bin/api` binary | 3-stage multi-stage `Dockerfile` (Node 22 + Go 1.25 + Alpine) | Self-contained, immutable container images |
| **Database Tuning** | Default untuned PostgreSQL settings | Tuned `shared_buffers=64MB`, `work_mem=4MB`, `max_conn=25` | Predictable PostGIS memory bounded to ~15-35 MiB |
| **Full Counties Latency (p50)**| 165 ms (warm Redis) | 137 ms (in-process cache) / **1 ms (ETag 304)** | Faster cold responses, instantaneous revalidation |
| **Frontend Asset Throughput** | N/A (unbuilt dev server) | **3,063 requests/sec** (served directly from Go binary) | Sub-millisecond portal rendering |

---

## 3. Detailed Milestone Journey & Architecture Decision Records

The refactoring followed an incremental, test-driven milestone progression documented across 8 ADRs:

1. **[ADR 0000: Architecture Decision Record Methodology](0000-record-architecture-decisions.md)**
   * Established the ADR framework, documentation standards, and commit hygiene on branch `refactor/lean-architecture`.
2. **[ADR 0001: Baseline Measurements (v1.0-redis-pgadmin)](0001-baseline-v1-measurements.md)**
   * Froze v1 with git tag `v1.0-redis-pgadmin`, captured baseline memory (258.7 MiB) and load latency benchmarks via ApacheBench.
3. **[ADR 0002: In-Process GeoJSON Caching](0002-in-process-geojson-cache.md)**
   * Replaced the external Redis cache with a thread-safe in-process memory cache implementing `CacheRepository`, eliminating network round-trips for read-only spatial payloads.
4. **[ADR 0003: In-Process Rate Limiter & Redis Elimination](0003-eliminate-redis.md)**
   * Replaced Redis-based IP rate limiting with an in-process sliding window limiter; completely purged Redis from code, `go.mod`, and `docker-compose.yml`.
5. **[ADR 0004: HTTP Caching & ETag Conditional Validation](0004-http-caching-etag-support.md)**
   * Added RFC 7234 compliant `Cache-Control` and SHA-256 `ETag` middleware. Repeat requests return `304 Not Modified` with zero payload body bytes.
6. **[ADR 0005: Configurable Frontend API URL](0005-configurable-frontend-api-url.md)**
   * Decoupled frontend components from hardcoded `localhost:18080`, supporting dynamic `VITE_API_BASE_URL` with relative `/api/v1` default.
7. **[ADR 0006: Database Memory Tuning & Removal of pgAdmin](0006-remove-pgadmin-tune-postgres.md)**
   * Removed pgAdmin (saving 177.5 MiB RAM); tuned PostgreSQL memory parameters (`shared_buffers=64MB`, `work_mem=4MB`, `max_connections=25`).
8. **[ADR 0007: Multi-Stage Dockerfile & Unified Single-Container Application](0007-unified-container-spa-serving.md)**
   * Created a 3-stage `Dockerfile` packaging the React 19 frontend and Go binary into a single lean container with SPA client-side routing fallback.

---

## 4. Verification & Validation Evidence

All architectural claims have been empirically verified on the live system:

1. **Automated Test Suite:**
   * `go test ./... -timeout 60s` passes across all packages (`cache`, `handler`, `middleware`, `service`, `integration`) in under 0.2 seconds.
2. **Resource Measurements:**
   * Raw baseline and load test outputs are preserved in `docs/baseline/`:
     * Idle stats: `docs/baseline/docker-stats-v2-final-idle.txt` (18.1 MiB total stack).
     * Post-load stats: `docs/baseline/docker-stats-v2-final-post-load.txt` (119.1 MiB peak under continuous concurrency).
     * Load benchmarks: `docs/baseline/ab-v2-*.txt`.
3. **Live Endpoints:**
   * Frontend: `curl -I http://localhost:18080/` -> `HTTP/1.1 200 OK` (Content-Type: text/html).
   * SPA Fallback: `curl -I http://localhost:18080/docs` -> `HTTP/1.1 200 OK` (serves `index.html`).
   * API Cache: `curl -I http://localhost:18080/api/v1/counties` -> Emits `ETag` & `Cache-Control`.
   * Revalidation: `curl -H 'If-None-Match: <etag>' http://localhost:18080/api/v1/counties` -> `HTTP/1.1 304 Not Modified` (0 bytes).

---

## 5. Tradeoffs & Limitations

Honesty about what is lost in a lean architecture:
* **Single-Node In-Process State:** The in-process cache and rate limiter are bounded to a single Go process. If the service is scaled horizontally across multiple instances without a load balancer with sticky sessions, each instance maintains its own cache and rate limits. For a static 35MB dataset, this is completely acceptable because each node only consumes ~80MB at full cache saturation.
* **Cold Starts After Restart:** Because the cache lives in process memory, restarting the container clears the cache. However, PostGIS query times on indexed tables are under 30ms, meaning cache re-population is negligible.
* **pgAdmin Removed from Docker Compose:** Ad-hoc database administration now requires connecting via a local GUI tool (DBeaver, TablePlus, pgAdmin local) or the standard `psql` CLI:
  ```bash
  docker compose exec db psql -U postgres -d kenya_boundaries
  ```

---

## 6. Conclusion

The v2 refactor achieved all architectural goals:
* Reduced stack memory footprint by **93%** (from 258.7 MiB down to 18.1 MiB).
* Dropped container count from **4 down to 2**.
* Eliminated external dependencies and external network hops.
* Added native HTTP caching and single-container unified deployment.
* Preserved 100% backwards compatibility for all API contracts and frontend views.
