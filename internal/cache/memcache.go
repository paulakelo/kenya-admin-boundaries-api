package cache

import (
	"context"
	"sync"
	"time"
)

// InMemoryCache provides an in-process, thread-safe, TTL-based key-value store.
// It implements the service.CacheRepository interface.
type InMemoryCache struct {
	mu    sync.RWMutex
	items map[string]item
	stop  chan struct{}
}

type item struct {
	val    []byte
	expiry time.Time
}

// NewInMemoryCache initializes an in-memory cache and starts a periodic janitor
// to purge expired entries, preventing memory leaks in long-running processes.
func NewInMemoryCache() *InMemoryCache {
	c := &InMemoryCache{
		items: make(map[string]item),
		stop:  make(chan struct{}),
	}
	go c.startJanitor(10 * time.Minute)
	return c
}

// Get retrieves the value associated with the key if present and unexpired.
func (c *InMemoryCache) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.RLock()
	it, ok := c.items[key]
	c.mu.RUnlock()

	if !ok || time.Now().After(it.expiry) {
		return nil, nil
	}

	// Return a defensive copy to prevent mutations from leaking into cache state
	cp := make([]byte, len(it.val))
	copy(cp, it.val)
	return cp, nil
}

// Set stores a key-value pair in the cache with the designated time-to-live duration.
func (c *InMemoryCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	c.mu.Lock()
	c.items[key] = item{
		val:    append([]byte{}, value...),
		expiry: time.Now().Add(ttl),
	}
	c.mu.Unlock()
	return nil
}

// Delete removes a specific key from the cache.
func (c *InMemoryCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
	return nil
}

// Close gracefully stops the background janitor goroutine.
func (c *InMemoryCache) Close() {
	select {
	case <-c.stop:
		// already closed
	default:
		close(c.stop)
	}
}

// startJanitor periodically sweeps expired entries from the cache map.
func (c *InMemoryCache) startJanitor(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-c.stop:
			return
		case now := <-ticker.C:
			c.mu.Lock()
			for k, v := range c.items {
				if now.After(v.expiry) {
					delete(c.items, k)
				}
			}
			c.mu.Unlock()
		}
	}
}
