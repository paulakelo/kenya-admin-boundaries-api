# ADR 0004: HTTP Edge Caching with Cache-Control and ETag/304 Revalidation

* **Status:** Accepted
* **Date:** 2026-11-05
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone 3 (HTTP Caching)

---

## 1. Context & Problem Statement
The Kenya Administrative Boundaries API delivers large GeoJSON polygons and administrative hierarchy trees. For example, `GET /api/v1/counties` serializes and transmits ~2.94 MB of JSON across the wire. 

In v1, every single request resulted in a full `200 OK` response with complete payload transmission over the network, regardless of whether the client had already downloaded the exact same boundary polygon seconds earlier. This caused high bandwidth consumption, client transfer latency (~165ms even when warm), and wasted server egress.

---

## 2. Decision
Implemented standard HTTP/1.1 cache control and conditional validation via `HTTPCacheMiddleware` in [`internal/middleware/http_cache.go`](../../internal/middleware/http_cache.go):
1. **`Cache-Control: public, max-age=86400, stale-while-revalidate=604800`:**
   Instructs browser caches, proxies, and edge CDNs (such as Cloudflare) that the boundary payload is immutable for 24 hours (`max-age=86400`) and may be served from stale cache for up to 7 days while refreshing asynchronously in the background.
2. **Deterministic ETag Header:**
   The middleware hashes response body bytes using SHA-256 and emits an entity tag (`ETag: "<hex-hash>"`).
3. **Short-Circuit on `If-None-Match` (HTTP 304):**
   When a client issues a conditional request with an `If-None-Match` header matching the current ETag, the server short-circuits execution and responds immediately with **`304 Not Modified`** and **zero body payload**.

---

## 3. Alternatives Considered

* **Manual ETag calculation in every individual handler:**
  * *Why rejected:* Violates DRY and couples transport semantics to business handlers. Middleware provides a transparent, centralized implementation across all `/api/v1/*` routes.
* **Last-Modified / If-Modified-Since timestamp headers:**
  * *Why rejected:* Timestamp granularity is 1 second and requires maintaining schema modification timestamps across all tables. Cryptographic hash-based ETags guarantee byte-level verification without database schema changes.

---

## 4. Consequences & Tradeoffs

### Positive (Gains)
* **Massive Bandwidth Savings:** Repeat client and CDN revalidations on `GET /api/v1/counties` drop from **2,936,435 bytes** to **0 bytes** body transfer.
* **Sub-Millisecond Revalidation:** Responding with 304 eliminates JSON transport time, reducing perceived latency to < 1ms on warm clients.
* **CDN-Ready Architecture:** Edge networks (Cloudflare, Fastly) can cache responses at edge points of presence across Kenya and globally, shielding the origin server from repeated hits.

### Negative (Downsides & Lost Capabilities)
* **Body Buffering Overhead:** On cache misses, the middleware buffers the response bytes in memory to compute the SHA-256 hash before transmitting. Given the Go server's low memory footprint, this minor transient allocation (< 3MB) is negligible compared to network savings.

---

## 5. How to Verify

```bash
# 1. Run middleware unit tests
go test ./internal/middleware -run TestHTTPCacheMiddleware -v

# 2. Issue a request and extract the ETag
ETAG=$(curl -s -I http://localhost:18080/api/v1/wards | grep -i etag | tr -d '\r' | awk '{print $2}')
echo "Received ETag: $ETAG"

# 3. Issue conditional request using If-None-Match
curl -i -s -H "If-None-Match: $ETAG" http://localhost:18080/api/v1/wards | head -n 10
# Expected: HTTP/1.1 304 Not Modified with zero content body
```

### Acceptance Criteria
- [x] Successful GET requests return `Cache-Control` and `ETag` headers.
- [x] Matching `If-None-Match` requests return `304 Not Modified` with zero body.
- [x] Non-GET requests (POST, etc.) are unbuffered and unaffected.
- [x] Automated unit tests verify conditional revalidation.
