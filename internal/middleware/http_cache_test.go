package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHTTPCacheMiddleware_Headers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(HTTPCacheMiddleware(86400, 604800))
	r.GET("/api/v1/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "kenya-boundaries"})
	})

	// Initial request without ETag
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	cc := w.Header().Get("Cache-Control")
	if cc != "public, max-age=86400, stale-while-revalidate=604800" {
		t.Errorf("unexpected Cache-Control header: %q", cc)
	}

	etag := w.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected non-empty ETag header")
	}

	// Subsequent request with matching If-None-Match header
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	req2.Header.Set("If-None-Match", etag)
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusNotModified {
		t.Fatalf("expected status 304 Not Modified, got %d", w2.Code)
	}

	if w2.Body.Len() != 0 {
		t.Errorf("expected empty body on 304 response, got %d bytes", w2.Body.Len())
	}

	// Request with mismatched ETag should return 200 OK
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	req3.Header.Set("If-None-Match", `"mismatched-etag"`)
	r.ServeHTTP(w3, req3)

	if w3.Code != http.StatusOK {
		t.Fatalf("expected status 200 OK on mismatched ETag, got %d", w3.Code)
	}
}

func TestHTTPCacheMiddleware_NonGet(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(HTTPCacheMiddleware(86400, 604800))
	r.POST("/api/v1/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "created"})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/test", nil)
	r.ServeHTTP(w, req)

	if w.Header().Get("ETag") != "" {
		t.Errorf("expected no ETag on POST request")
	}
	if w.Header().Get("Cache-Control") != "" {
		t.Errorf("expected no Cache-Control on POST request")
	}
}
