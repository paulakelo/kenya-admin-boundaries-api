# ADR 0001: Baseline V1 Architecture & Resource Measurements

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 0 (Freeze and Baseline)
* **Git Tag:** `v1.0-redis-pgadmin`
* **Frozen Commit SHA:** `cf539a7d29dae69807b0f02d094bc65ee2d62713`

---

## 1. Context & Baseline Architecture

The `kenya-admin-boundaries-api` v1 architecture delivers administrative and electoral boundaries across Kenya down to the ward level. Before initiating our refactoring on the `refactor/lean-architecture` branch, we froze the v1 architecture with annotated tag `v1.0-redis-pgadmin` and archived the v1 architecture specification to [`docs/history/v1-architecture.md`](../history/v1-architecture.md).

### V1 Topology & Moving Parts
In v1, the local container stack consists of 4 distinct services:
1. **`spatial_pg` (`postgis/postgis:15-3.3`):** Relational spatial database with 2D GIST indexes, containing 47 counties, 290 constituencies, 412 sub-counties, and 1,450 wards (~35 MB total table storage).
2. **`spatial_redis` (`redis:7-alpine`):** In-memory cache store storing 24-hour serialized GeoJSON strings and managing client IP rate limiting (fixed window of 60 req/min).
3. **`pgadmin` (`dpage/pgadmin4:7`):** Web management UI for PostgreSQL.
4. **`spatial_api` (`alpine:3.18`):** Go REST API compiled on host into `./bin/api` and mounted into the container.

---

## 2. Test Suite Baseline State

We ran the automated test suite with a 60-second timeout:

```bash
go test ./... -timeout 60s
```

### Empirical Test Findings
* **`internal/service`**: `ok` (0.006s)
* **`tests/integration`**: `ok` (0.010s) — *Skipped by default unless `INTEGRATION=true` is set, because it requires an active PostGIS connection pool.* When run with `INTEGRATION=true go test ./tests/integration -v -timeout 10s`, it passes in 0.207s against `127.0.0.1:5433`.
* **`internal/handler`**: **`FAIL` (0.011s)**
  * **Failing test:** `TestSpatialIntersectRoute` (`router_test.go:75: expected status 200 got 404: 404 page not found`).
  * **Root Cause:** The test issues a `POST /api/v1/spatial/intersect`, but this route is never registered inside `internal/handler/router.go`.
* **Discovered Router Bug in V1:**
  * When hitting `GET /api/v1/counties/:slug` (e.g. `/api/v1/counties/KE047`), the server responds with **`501 Not Implemented`**.
  * In `internal/handler/router.go` lines 137–154, the router attempts a type assertion `s, ok := svc.(slugSvc)`. Because `main.go` wraps the services inside `*handler.AppServices`, the router fails to unpack `svcApp.County.GetCountyBySlug` (unlike `/counties`, `/constituencies`, and `/hierarchy`, which explicitly unpack `svcApp`).
  * Per Milestone 0 rules, **no application code was modified**. This baseline is recorded as an existing defect of v1.

Raw test log saved to: [`docs/baseline/go-test-baseline.txt`](../baseline/go-test-baseline.txt).

---

## 3. Empirical Resource & Performance Measurements

### 3.1 Container Memory Footprint (Idle vs. Post-Load)

Recorded via `docker stats --no-stream pgadmin spatial_api spatial_pg spatial_redis`:

| Service | Container Image | Idle Memory (RSS) | Post-Load Memory (RSS) | % of Total Stack (Post-Load) |
| :--- | :--- | :--- | :--- | :--- |
| **`pgadmin`** | `dpage/pgadmin4:7` | **177.5 MiB** | **177.5 MiB** | **68.6%** |
| **`spatial_api`** | `alpine:3.18` (Go binary) | **71.21 MiB** | **43.54 MiB** | **16.8%** |
| **`spatial_pg`** | `postgis/postgis:15-3.3` | **34.98 MiB** | **30.46 MiB** | **11.8%** |
| **`spatial_redis`** | `redis:7-alpine` | **5.68 MiB** | **7.19 MiB** | **2.8%** |
| **Total Stack** | **4 Containers** | **289.37 MiB** | **258.69 MiB** | **100.0%** |

> [!IMPORTANT]
> **Key Finding:** `pgadmin` consumes nearly **70% of the entire stack's memory** while providing zero API functionality. Dropping `pgadmin` in Milestone 5 will immediately reclaim ~177 MB of RAM.

Raw stats saved to:
* Idle: [`docs/baseline/docker-stats-v1-idle.txt`](../baseline/docker-stats-v1-idle.txt)
* Post-load: [`docs/baseline/docker-stats-v1-post-load.txt`](../baseline/docker-stats-v1-post-load.txt)

---

### 3.2 Endpoint Latency & Throughput (Cold vs. Warm Cache)

Load testing was executed using ApacheBench (`/usr/bin/ab`) with `n=30` requests and concurrency `c=2`.
* **Cold Run:** Executed immediately after a full Redis flush (`redis-cli FLUSHALL`).
* **Warm Run:** Executed immediately following the cold run, with Redis holding precomputed GeoJSON strings.
* **Rate Limit Handling:** Because v1 enforces a strict 60 req/min per-IP limit via Redis, rate-limit keys (`ratelimit:*`) were flushed between endpoint benchmarks so tests were not rejected with HTTP 429.

#### Benchmark Summary Table

| Endpoint | HTTP Status | Payload Size | Cold Req/sec | Cold p50 | Cold p95 | Warm Req/sec | Warm p50 | Warm p95 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/counties` | 200 OK | ~2.94 MB | 10.34 #/s | 166 ms | 215 ms | **11.76 #/s** | **165 ms** | **182 ms** |
| `GET /api/v1/counties/KE047` | 501 Not Impl | 66 bytes | 327.71 #/s | 5 ms | 9 ms | **944.17 #/s** | **2 ms** | **3 ms** |
| `GET /api/v1/counties/KE047/hierarchy` | 200 OK | ~1.6 KB | 333.17 #/s | 5 ms | 9 ms | **476.97 #/s** | **4 ms** | **6 ms** |
| `GET /api/v1/wards` | 200 OK | ~6.5 KB | 313.82 #/s | 5 ms | 9 ms | **349.08 #/s** | **5 ms** | **9 ms** |

#### Observations
1. **Heavy County GeoJSON Payload:** `GET /api/v1/counties` serializes and transfers **2.94 MB of GeoJSON per request** (all 47 county MultiPolygons). The bottleneck here is JSON serialization and network buffer transfer, averaging ~165ms p50 even when cached in Redis.
2. **Lightweight Endpoints:** Hierarchical metadata and wards endpoints return in under 6ms p50 cold, dropping to 4ms warm.
3. **Warm-Cache Throughput Gain:** Caching yields modest throughput gains on lightweight endpoints (333 -> 476 req/s on hierarchy) and drops p95 on `/counties` from 215ms to 182ms.

Raw benchmark reports saved to:
* Counties: [`docs/baseline/ab-counties-cold.txt`](../baseline/ab-counties-cold.txt), [`docs/baseline/ab-counties-warm.txt`](../baseline/ab-counties-warm.txt)
* County Slug (501): [`docs/baseline/ab-county-slug-cold.txt`](../baseline/ab-county-slug-cold.txt), [`docs/baseline/ab-county-slug-warm.txt`](../baseline/ab-county-slug-warm.txt)
* County Hierarchy: [`docs/baseline/ab-county-hierarchy-cold.txt`](../baseline/ab-county-hierarchy-cold.txt), [`docs/baseline/ab-county-hierarchy-warm.txt`](../baseline/ab-county-hierarchy-warm.txt)
* Wards: [`docs/baseline/ab-wards-cold.txt`](../baseline/ab-wards-cold.txt), [`docs/baseline/ab-wards-warm.txt`](../baseline/ab-wards-warm.txt)

---

## 4. How to Reproduce These Baseline Measurements

Run the exact steps below:

```bash
# 1. Ensure stack is running
docker compose up -d

# 2. Run test suite
go test ./... -timeout 60s

# 3. Capture idle stats
docker stats --no-stream pgadmin spatial_api spatial_pg spatial_redis

# 4. Flush Redis for clean cold test
docker exec spatial_redis redis-cli FLUSHALL

# 5. Benchmark Counties (Cold, then Warm)
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/counties
# Reset rate limit key
docker exec spatial_redis redis-cli --scan --pattern "ratelimit:*" | xargs -r docker exec -i spatial_redis redis-cli del
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/counties

# 6. Benchmark Hierarchy (Cold, then Warm)
docker exec spatial_redis redis-cli --scan --pattern "ratelimit:*" | xargs -r docker exec -i spatial_redis redis-cli del
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/counties/KE047/hierarchy
docker exec spatial_redis redis-cli --scan --pattern "ratelimit:*" | xargs -r docker exec -i spatial_redis redis-cli del
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/counties/KE047/hierarchy

# 7. Benchmark Wards (Cold, then Warm)
docker exec spatial_redis redis-cli --scan --pattern "ratelimit:*" | xargs -r docker exec -i spatial_redis redis-cli del
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/wards
docker exec spatial_redis redis-cli --scan --pattern "ratelimit:*" | xargs -r docker exec -i spatial_redis redis-cli del
ab -n 30 -c 2 http://127.0.0.1:18080/api/v1/wards

# 8. Capture post-load stats
docker stats --no-stream pgadmin spatial_api spatial_pg spatial_redis
```

---

## 5. Milestone 0 Acceptance Checklist
- [x] Working tree clean; `v1.0-redis-pgadmin` tag created at `cf539a7d29dae69807b0f02d094bc65ee2d62713`.
- [x] Switched to branch `refactor/lean-architecture`.
- [x] V1 architecture preserved at `docs/history/v1-architecture.md`.
- [x] ADR framework initialized (`0000-record-architecture-decisions.md` & `template.md`).
- [x] Test suite state evaluated and recorded without application code modifications.
- [x] Idle and post-load container memory captured.
- [x] Load tests executed across cold and warm states for key endpoints; raw logs saved in `docs/baseline/`.
