# ADR 0003: Eliminate Redis Daemon and Migrate to In-Process Rate Limiter

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 2 (Eliminate Redis)

---

## 1. Context & Problem Statement
Following Milestone 1, all spatial and GeoJSON caching was moved into the Go process memory (`InMemoryCache`). However, Redis 7 was still retained solely to perform fixed-window IP request counting for the rate-limiting middleware (`RateLimiter`).

Retaining a Redis daemon exclusively for simple IP counting incurred:
* A dedicated container (`spatial_redis`) consuming ~7 MiB idle/post-load RSS.
* Port 6379 exposure, container orchestration complexity, and network volume management.
* An external third-party Go client dependency (`github.com/redis/go-redis/v9`).

---

## 2. Decision
1. **Implement In-Process Rate Limiter:** Implemented `InProcessRateLimiter` in [`internal/middleware/rate_limiter.go`](../../internal/middleware/rate_limiter.go) using standard Go synchronization (`sync.Mutex`) and a thread-safe map tracking per-IP request counters and window expiration with an automated 5-minute background sweep.
2. **Purge Redis Repository:** Removed `internal/repository/redis/cache_repo.go`.
3. **Purge Redis from Orchestration:** Removed the `redis` service and `redis_data` volume from [`docker-compose.yml`](../../docker-compose.yml) and [`docker-compose.override.yml`](../../docker-compose.override.yml).
4. **Prune Go Dependencies:** Ran `go mod tidy` to completely remove `github.com/redis/go-redis/v9` from `go.mod` and `go.sum`.

---

## 3. Alternatives Considered

* **Retaining Redis for rate limiting:**
  * *Why rejected:* Running an entire Redis container solely to increment an integer counter for single-instance or small-scale deployments is gratuitous overhead.
* **Third-party in-memory rate-limiter libraries (e.g. `ulule/limiter`, `tollbooth`):**
  * *Why rejected:* A lightweight sliding-window counter in 100 lines of standard library Go avoids adding another unvetted dependency to `go.mod`.

---

## 4. Consequences & Tradeoffs

### Positive (Gains)
* **Zero Redis Moving Parts:** Container count reduced from 4 to 3 (`pgadmin`, `spatial_pg`, `spatial_api`).
* **Smaller Binary & Supply Chain:** Removed `go-redis` and its sub-dependencies (`cespare/xxhash/v2`, `dgryski/go-rendezvous`) from `go.mod`.
* **Zero Network Hop on Rate Limit Checks:** Every HTTP request evaluates rate limits in nanoseconds within Go heap memory.

### Negative (Downsides & Lost Capabilities)
* **Distributed Rate Limiting:** In a multi-node cluster, each node maintains its own rate-limit table per IP rather than a unified global counter. For production architectures on prudent resources, global rate limiting is properly offloaded to the edge CDN (e.g., Cloudflare Free Tier).

---

## 5. How to Verify

```bash
# 1. Run middleware unit tests
go test ./internal/middleware -v

# 2. Check running docker containers
docker compose ps
# Expected: Only pgadmin, spatial_api, and spatial_pg. Zero Redis containers.

# 3. Verify rate limit headers
curl -i http://localhost:18080/api/v1/wards | grep X-Ratelimit

# 4. Verify go.mod contains no redis dependency
grep -i redis go.mod
# Expected: no matches
```

### Acceptance Criteria
- [x] Redis service and volumes eliminated from Docker Compose.
- [x] `github.com/redis/go-redis/v9` pruned from `go.mod`.
- [x] In-process rate limiter successfully protects endpoints and sets rate limit headers.
- [x] All unit tests pass.
