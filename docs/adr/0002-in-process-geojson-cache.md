# ADR 0002: In-Process GeoJSON Caching Behind CacheRepository

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 1 (In-Process GeoJSON Cache)

---

## 1. Context & Problem Statement
In v1, all administrative boundary GeoJSON payloads (Counties, Constituencies, Sub-Counties, Wards, and Spatial Intersections) were cached in an external Redis 7 container with a 24-hour TTL. 

Every cache read required:
1. TCP network socket round-trip between Go API and Redis.
2. Serialization and deserialization of large GeoJSON strings (~2.94 MB for 47 counties).
3. Maintaining an active Redis connection pool and handling potential connection loss.

Because Kenya's administrative boundaries are read-only reference data (~35 MB total table storage in PostgreSQL), caching this data in an external daemon introduces unnecessary networking latency, memory overhead, and an operational failure domain.

---

## 2. Decision
1. **Activate In-Process Caching:** Enhanced [`internal/cache/memcache.go`](../../internal/cache/memcache.go) to provide a thread-safe (`sync.RWMutex`), TTL-aware in-process memory cache with an automatic background sweep (janitor) that purges expired entries every 10 minutes.
2. **Decouple Spatial Service:** Refactored `SpatialService` in [`internal/service/spatial_service.go`](../../internal/service/spatial_service.go) to depend on the `CacheRepository` interface (`Get`, `Set`) rather than a direct `*redis.Client` struct pointer.
3. **Wire In-Process Cache via Dependency Injection:** In [`backend/cmd/api/main.go`](../../backend/cmd/api/main.go), instantiated `cache.NewInMemoryCache()` and injected it into all five core domain services (`CountyService`, `ConstituencyService`, `SpatialService`, `SubCountyService`, `WardService`).
4. **Isolate Redis to Rate Limiting Only:** Redis connection in `main.go` is now strictly restricted to `middleware.RateLimiter`. Redis stores zero boundary or spatial data.

---

## 3. Alternatives Considered

* **Retaining Redis for GeoJSON Caching:**
  * *Why rejected:* Wasteful. Adds ~1ms network socket serialization latency and requires 30MB+ of dedicated Redis RAM for static data that never changes.
* **Third-party in-memory cache libraries (e.g. `dgraph-io/ristretto`, `hashicorp/golang-lru`):**
  * *Why rejected:* Per standing rule 4 (no new dependencies without strict necessity), the existing `InMemoryCache` with RWMutex and TTL sweep satisfies all requirements with zero external dependencies.
* **No Cache (direct PostGIS queries every time):**
  * *Why rejected:* Computing `ST_AsGeoJSON` on complex MultiPolygons repeatedly causes avoidable database CPU load under concurrent requests.

---

## 4. Consequences & Tradeoffs

### Positive (Gains)
* **Zero Network Latency on Cache Hits:** Memory lookups happen within nanoseconds in process memory without TCP overhead.
* **Clean Architecture Compliance:** `SpatialService` no longer violates the Dependency Inversion Principle; all services now share the same `CacheRepository` interface.
* **Reduced Redis Utilization:** Redis memory drops to strictly storing transient rate-limit counters (< 2MB).

### Negative (Downsides & Lost Capabilities)
* **Process Lifetime Bound:** In-process cache is cold when the API process restarts. The first request after startup queries PostGIS before warming.
* **Multi-Instance Redundancy:** If the API is horizontally scaled across multiple instances without a reverse-proxy cache, each instance maintains its own in-memory cache. (For single-VM budget deployments, this is irrelevant).

---

## 5. How to Verify

```bash
# 1. Run unit tests for the cache and services
go test ./internal/cache ./internal/service -v

# 2. Flush Redis to prove it is empty
docker exec spatial_redis redis-cli FLUSHALL

# 3. Hit the counties endpoint twice
curl -s -o /dev/null -w "Cold: %{time_total}s\n" http://localhost:18080/api/v1/counties
curl -s -o /dev/null -w "Warm: %{time_total}s\n" http://localhost:18080/api/v1/counties

# 4. Verify Redis keys - only rate-limiting keys should appear
docker exec spatial_redis redis-cli KEYS "*"
# Expected output: only "ratelimit:..." keys; ZERO "counties:*", "wards:*", etc.
```

### Acceptance Criteria
- [x] All 5 services consume `service.CacheRepository` implemented by `cache.InMemoryCache`.
- [x] `SpatialService` has no dependency on `*redis.Client`.
- [x] Cache unit tests pass with concurrency and TTL validation.
- [x] Redis stores zero GeoJSON or boundary cache keys.
