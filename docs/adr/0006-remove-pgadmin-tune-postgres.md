# ADR 0006: Eliminate pgAdmin Container and Tune PostgreSQL Memory for Low-Resource Environments

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 5 (Eliminate pgAdmin & Tune Postgres)

---

## 1. Context & Problem Statement
In the baseline measurements (ADR 0001), `pgadmin` accounted for **177.5 MiB out of 258.7 MiB (68.6%)** of total post-load container memory. pgAdmin provided zero user-facing functionality and served solely as a developer database visualizer.

Furthermore, the default PostgreSQL configuration allocated standard server-sized buffer pools and connection limits (`max_connections=100`, `shared_buffers=128MB`), which exceeded the requirements of an immutable ~35 MB reference dataset.

Running an unnecessary web GUI container and untuned database configurations prevents this system from being deployed on budget VPS tiers (e.g. 512MB–1GB RAM).

---

## 2. Decision
1. **Eliminate pgAdmin from Orchestration:**
   Removed the `pgadmin` service and its associated volume `pgadmin_data` from [`docker-compose.yml`](../../docker-compose.yml) and [`docker-compose.override.yml`](../../docker-compose.override.yml).
   *Database administration is now handled via SSH tunneling and local client utilities (TablePlus, DBeaver, or `psql`).*
2. **Tune PostgreSQL Memory Settings:**
   Configured PostgreSQL command flags in `docker-compose.yml`:
   ```yaml
   command: >
     postgres
     -c shared_buffers=64MB
     -c work_mem=4MB
     -c maintenance_work_mem=16MB
     -c effective_cache_size=128MB
     -c max_connections=25
   ```
   *Rationale:* 64 MB of `shared_buffers` easily fits the entire 35 MB spatial dataset directly into Postgres shared memory while capping connection overhead to 25 connections (our single API process utilizes a connection pool of ~10).

---

## 3. Alternatives Considered

* **Keep pgAdmin stopped by default via Docker Compose profiles (e.g. `profiles: ["debug"]`):**
  * *Why rejected:* Production configuration files should reflect actual production architecture without dormant dev utilities that risk accidental startup or security vulnerabilities.
* **Switch from PostgreSQL to SQLite + SpatiaLite:**
  * *Why rejected:* SpatiaLite requires rewriting all `sqlc` queries, modifying build dependencies with CGO, and forfeiting native PostGIS features (`ST_AsGeoJSON` and GIST indexing). A tuned PostgreSQL container uses only ~14 MB RAM, rendering a full database rewrite unnecessary.

---

## 4. Consequences & Empirical Re-measurements

### 4.1 Memory Footprint Comparison

| Container | v1 Baseline (Post-Load) | Milestone 5 (Post-Load) | Absolute Delta | % Reduction |
| :--- | :--- | :--- | :--- | :--- |
| `pgadmin` | 177.50 MiB | **0.00 MiB (Removed)** | -177.50 MiB | **-100.0%** |
| `spatial_redis` | 7.19 MiB | **0.00 MiB (Removed)** | -7.19 MiB | **-100.0%** |
| `spatial_api` | 43.54 MiB | **13.48 MiB** | -30.06 MiB | **-69.0%** |
| `spatial_pg` | 30.46 MiB | **14.80 MiB** | -15.66 MiB | **-51.4%** |
| **Total Stack** | **258.69 MiB** | **28.28 MiB** | **-230.41 MiB** | **-89.1%** |

### 4.2 Throughput & Latency Comparison

| Endpoint | v1 Baseline Warm Req/s | Milestone 5 Warm Req/s | v1 p50 | Milestone 5 p50 |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/counties` | 11.76 #/s | **1,289.32 #/s** | 165 ms | **1 ms** |
| `GET /api/v1/wards` | 349.08 #/s | **1,215.71 #/s** | 5 ms | **1 ms** |
| `GET /api/v1/counties/KE047/hierarchy` | 476.97 #/s | **652.00 #/s** | 4 ms | **1 ms** |

---

## 5. How to Verify

```bash
# 1. Verify active compose services
docker compose ps
# Expected: Only spatial_api and spatial_pg are running

# 2. Check current resource usage
docker stats --no-stream spatial_api spatial_pg
# Expected: Combined memory < 35 MiB

# 3. Test API functionality
curl -s http://localhost:18080/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:18080/api/v1/counties
```

### Acceptance Criteria
- [x] `pgadmin` service and volumes removed from all compose files.
- [x] PostgreSQL configured with memory constraints (`shared_buffers=64MB`, `max_connections=25`).
- [x] Total container stack memory drops from ~258 MB to under 30 MB.
- [x] Sub-2ms p50 latency verified across cached endpoints.
