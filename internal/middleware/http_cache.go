package middleware

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type bodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *bodyWriter) Write(b []byte) (int, error) {
	return w.body.Write(b)
}

func (w *bodyWriter) WriteString(s string) (int, error) {
	return w.body.WriteString(s)
}

// HTTPCacheMiddleware attaches standard HTTP Cache-Control and ETag headers
// to GET responses. If the client provides a matching If-None-Match header,
// it short-circuits with HTTP 304 Not Modified and transmits zero body payload.
func HTTPCacheMiddleware(maxAgeSeconds int, staleWhileRevalidateSeconds int) gin.HandlerFunc {
	cacheControlVal := fmt.Sprintf("public, max-age=%d, stale-while-revalidate=%d", maxAgeSeconds, staleWhileRevalidateSeconds)

	return func(c *gin.Context) {
		// Only evaluate caching headers on idempotent GET and HEAD requests
		if c.Request.Method != http.MethodGet && c.Request.Method != http.MethodHead {
			c.Next()
			return
		}

		bw := &bodyWriter{body: bytes.NewBuffer(nil), ResponseWriter: c.Writer}
		c.Writer = bw

		c.Next()

		// Apply caching headers strictly to 200 OK responses
		if bw.Status() == http.StatusOK {
			bodyBytes := bw.body.Bytes()
			hash := sha256.Sum256(bodyBytes)
			etag := `"` + hex.EncodeToString(hash[:16]) + `"`

			c.Header("Cache-Control", cacheControlVal)
			c.Header("ETag", etag)

			clientETag := c.GetHeader("If-None-Match")
			if clientETag != "" && (clientETag == etag || strings.Contains(clientETag, etag) || clientETag == "*") {
				c.Status(http.StatusNotModified)
				bw.ResponseWriter.WriteHeader(http.StatusNotModified)
				return
			}

			_, _ = bw.ResponseWriter.Write(bodyBytes)
		} else {
			_, _ = bw.ResponseWriter.Write(bw.body.Bytes())
		}
	}
}
