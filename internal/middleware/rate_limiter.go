package middleware

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientRecord struct {
	count     int
	expiresAt time.Time
}

// InProcessRateLimiter provides an in-memory, sliding-window rate limiter per client IP.
type InProcessRateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientRecord
	limit   int
	window  time.Duration
	stop    chan struct{}
}

// NewInProcessRateLimiter initializes the limiter and starts background sweeping of expired client records.
func NewInProcessRateLimiter(limit int, window time.Duration) *InProcessRateLimiter {
	limiter := &InProcessRateLimiter{
		clients: make(map[string]*clientRecord),
		limit:   limit,
		window:  window,
		stop:    make(chan struct{}),
	}
	go limiter.cleanup(5 * time.Minute)
	return limiter
}

// Middleware returns a Gin middleware handler enforcing the rate limit.
func (l *InProcessRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if l == nil || l.limit <= 0 {
			c.Next()
			return
		}

		clientIP := c.ClientIP()
		now := time.Now()

		l.mu.Lock()
		rec, exists := l.clients[clientIP]
		if !exists || now.After(rec.expiresAt) {
			rec = &clientRecord{
				count:     1,
				expiresAt: now.Add(l.window),
			}
			l.clients[clientIP] = rec
		} else {
			rec.count++
		}

		count := rec.count
		remaining := l.limit - count
		retryAfter := int(time.Until(rec.expiresAt).Seconds())
		if retryAfter < 1 {
			retryAfter = 1
		}
		l.mu.Unlock()

		if remaining < 0 {
			remaining = 0
		}

		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", l.limit))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", retryAfter))

		if count > l.limit {
			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests. Please slow down.",
				"retry_after": retryAfter,
			})
			return
		}

		c.Next()
	}
}

// RateLimiter returns a standalone Gin middleware handler using an in-process rate limiter.
func RateLimiter(limit int, window time.Duration) gin.HandlerFunc {
	limiter := NewInProcessRateLimiter(limit, window)
	return limiter.Middleware()
}

// Close gracefully terminates the background cleanup goroutine.
func (l *InProcessRateLimiter) Close() {
	select {
	case <-l.stop:
	default:
		close(l.stop)
	}
}

// cleanup periodically sweeps expired IP records from memory.
func (l *InProcessRateLimiter) cleanup(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-l.stop:
			return
		case now := <-ticker.C:
			l.mu.Lock()
			for ip, rec := range l.clients {
				if now.After(rec.expiresAt) {
					delete(l.clients, ip)
				}
			}
			l.mu.Unlock()
		}
	}
}
