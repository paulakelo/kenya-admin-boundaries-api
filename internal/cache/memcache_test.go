package cache

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestInMemoryCache_SetAndGet(t *testing.T) {
	c := NewInMemoryCache()
	defer c.Close()

	ctx := context.Background()
	key := "test:key"
	val := []byte("hello world")

	if err := c.Set(ctx, key, val, 1*time.Minute); err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	got, err := c.Get(ctx, key)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}

	if string(got) != string(val) {
		t.Errorf("got %q, want %q", got, val)
	}
}

func TestInMemoryCache_Expiration(t *testing.T) {
	c := NewInMemoryCache()
	defer c.Close()

	ctx := context.Background()
	key := "expire:key"
	val := []byte("temporary")

	if err := c.Set(ctx, key, val, 20*time.Millisecond); err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	time.Sleep(30 * time.Millisecond)

	got, err := c.Get(ctx, key)
	if err != nil {
		t.Fatalf("Get returned error: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil for expired key, got %q", got)
	}
}

func TestInMemoryCache_Delete(t *testing.T) {
	c := NewInMemoryCache()
	defer c.Close()

	ctx := context.Background()
	key := "delete:key"
	val := []byte("delete me")

	_ = c.Set(ctx, key, val, 1*time.Minute)
	if err := c.Delete(ctx, key); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	got, err := c.Get(ctx, key)
	if err != nil || got != nil {
		t.Errorf("expected key to be deleted, got %v, err %v", got, err)
	}
}

func TestInMemoryCache_Concurrency(t *testing.T) {
	c := NewInMemoryCache()
	defer c.Close()

	ctx := context.Background()
	var wg sync.WaitGroup

	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			key := "concurrent:key"
			_ = c.Set(ctx, key, []byte("data"), 1*time.Minute)
			_, _ = c.Get(ctx, key)
		}(i)
	}

	wg.Wait()
}
