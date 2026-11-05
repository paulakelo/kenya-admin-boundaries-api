package main

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/paula-dot/kenya-admin-boundaries-api/internal/cache"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/config"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/handler"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/middleware"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/repository"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/repository/postgres"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// 1. Initialize Context
	ctx := context.Background()

	// 2. Load Configuration
	cfg, err := config.LoadConfig(".")
	if err != nil {
		log.Fatalf("Unable to load configuration: %v\n", err)
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.DBUrl == "" {
		// keep a sensible fallback for environments where .env is not present
		cfg.DBUrl = "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	// Print final DSN but redact the password when possible
	if u, err := url.Parse(cfg.DBUrl); err == nil {
		if u.User != nil {
			username := u.User.Username()
			// replace password with REDACTED for safe logging
			u.User = url.UserPassword(username, "REDACTED")
		}
		log.Printf("Using DATABASE_URL: %s\n", u.String())
	} else {
		log.Printf("Using DATABASE_URL (unparsed): %s\n", cfg.DBUrl)
	}

	// 3. Database Connection Pooling (pgxpool)
	dbPool, err := pgxpool.New(ctx, cfg.DBUrl)
	if err != nil {
		log.Fatalf("Unable to create database connection pool: %v\n", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("Successfully connected to database!")

	// Create sqlc-generated Queries (used by SpatialService)
	sqlcQueries := postgres.New(dbPool)

	pgRepo := postgres.NewCountyRepository(dbPool)
	// create constituency repository and service so router can list constituencies
	consRepo := postgres.NewConstituencyRepository(dbPool)
	// create sub-county repository
	subCountyRepo := postgres.NewSubCountyRepository(dbPool)
	// create ward repository
	wardRepo := postgres.NewWardRepository(dbPool)

	// Initialize thread-safe in-process cache for GeoJSON and reference metadata
	inMemoryCache := cache.NewInMemoryCache()
	defer inMemoryCache.Close()

	// Initialize in-process rate limiter (60 requests per minute per IP)
	rateLimiter := middleware.NewInProcessRateLimiter(60, time.Minute)
	defer rateLimiter.Close()

	spatialRepo := &repository.SpatialRepository{DB: dbPool}

	// All services utilize the high-speed in-process cache
	countySvc := service.NewCountyService(pgRepo, inMemoryCache, spatialRepo)
	consSvc := service.NewConstituencyService(consRepo, inMemoryCache)
	spatialSvc := service.NewSpatialService(sqlcQueries, inMemoryCache)
	subCountySvc := service.NewSubCountyService(subCountyRepo, inMemoryCache)
	wardSvc := service.NewWardService(wardRepo, inMemoryCache)

	// Use the handler.AppServices type so SetupRouter can register explicit handlers
	svc := &handler.AppServices{
		County:       countySvc,
		Constituency: consSvc,
		Spatial:      spatialSvc,
		SubCounty:    subCountySvc,
		Ward:         wardSvc,
	}

	// wire svc into handlers/router and apply rate limiter + HTTP cache headers middleware to /api/v1
	router := handler.SetupRouter(
		svc,
		rateLimiter.Middleware(),
		middleware.HTTPCacheMiddleware(86400, 604800), // 24h max-age, 7d stale-while-revalidate
	)

	// Health endpoint (ensure SetupRouter sets other routes; this is a safe fallback)
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "API is up and running!",
			"env":    cfg.Environment,
		})
	})

	// Expose routes list for quick debugging
	router.GET("/__routes", func(c *gin.Context) {
		routes := router.Routes()
		type simpleRoute struct {
			Method string `json:"method"`
			Path   string `json:"path"`
		}
		out := make([]simpleRoute, 0, len(routes))
		for _, r := range routes {
			out = append(out, simpleRoute{Method: r.Method, Path: r.Path})
		}
		c.JSON(http.StatusOK, out)
	})

	// Note: route registration happens inside SetupRouter. Avoid registering the
	// same routes again here to prevent duplicate route registration panics.

	// 5. Server Initialization
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	// 6. Graceful Shutdown Implementation
	go func() {
		log.Printf("Starting API server on port %s...\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to listen and serve: %v\n", err)
		}
	}()

	// Wait for an interrupt signal to gracefully shut down the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown signal received. Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	ctxShutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctxShutdown); err != nil {
		log.Fatalf("Server forced to shutdown: %v\n", err)
	}

	log.Println("Server shut down successfully")
}
