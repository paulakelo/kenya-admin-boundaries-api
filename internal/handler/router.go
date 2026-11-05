package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/paula-dot/kenya-admin-boundaries-api/internal/domain"
	"github.com/paula-dot/kenya-admin-boundaries-api/internal/service"
	"github.com/paula-dot/kenya-admin-boundaries-api/pkg/geojson"
)

type AppServices struct {
	County       *service.CountyService
	Constituency *service.ConstituencyService
	Spatial      *service.SpatialService
	SubCounty    *service.SubCountyService
	Ward         *service.WardService
}

// SetupRouter wires service into HTTP routes and returns a *gin.Engine.
// Accepts optional middleware functions that will be applied to the /api/v1
// route group. This allows callers to attach rate-limiters, cache-control or auth middleware.
func SetupRouter(svc interface{}, v1Middleware ...gin.HandlerFunc) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "If-None-Match"},
		ExposeHeaders:    []string{"Content-Length", "ETag", "Cache-Control", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"},
		AllowCredentials: false,
	}))

	r.Use(func(c *gin.Context) {
		log.Printf("[REQ] Method=%s RequestURI=%s URL.Path=%s Host=%s Referer=%s\n",
			c.Request.Method,
			c.Request.RequestURI,
			c.Request.URL.Path,
			c.Request.Host,
			c.GetHeader("Referer"),
		)
		c.Next()
	})

	// create the /api/v1 group and apply any provided middleware
	v1 := r.Group("/api/v1", v1Middleware...)
	{
		// List all counties as GeoJSON FeatureCollection
		v1.GET("/counties", func(c *gin.Context) {
			ctx := c.Request.Context()

			type listSvc interface {
				ListCountiesAsFeatureCollection(ctx context.Context) (*geojson.FeatureCollection, error)
			}

			if svcApp, ok := svc.(*AppServices); ok && svcApp.County != nil {
				fc, err := svcApp.County.ListCountiesAsFeatureCollection(ctx)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			if s, ok := svc.(*service.CountyService); ok {
				fc, err := s.ListCountiesAsFeatureCollection(ctx)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			if s, ok := svc.(listSvc); ok {
				fc, err := s.ListCountiesAsFeatureCollection(context.Background())
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			c.JSON(http.StatusNotImplemented, gin.H{"error": "ListCountiesAsFeatureCollection not implemented in service"})
		})

		// List all constituencies as a GeoJSON FeatureCollection
		v1.GET("/constituencies", func(c *gin.Context) {
			ctx := c.Request.Context()

			if svcApp, ok := svc.(*AppServices); ok && svcApp.Constituency != nil {
				fc, err := svcApp.Constituency.ListAllAsFeatureCollection(ctx)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			c.JSON(http.StatusNotImplemented, gin.H{"error": "ListAllAsFeatureCollection not implemented for constituencies"})
		})

		// GET /api/v1/counties/:slug
		v1.GET("/counties/:slug", func(c *gin.Context) {
			slug := c.Param("slug")
			ctx := c.Request.Context()

			if svcApp, ok := svc.(*AppServices); ok && svcApp.County != nil {
				cnt, err := svcApp.County.GetCountyBySlug(ctx, slug)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
					return
				}
				fc := buildFeatureCollectionFromCounties([]*domain.County{cnt})
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			type slugSvc interface {
				GetCountyBySlug(ctx context.Context, slug string) (*domain.County, error)
			}

			if s, ok := svc.(slugSvc); ok {
				cnt, err := s.GetCountyBySlug(ctx, slug)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
					return
				}
				fc := buildFeatureCollectionFromCounties([]*domain.County{cnt})
				out, _ := json.Marshal(fc)
				c.Data(http.StatusOK, "application/geo+json", out)
				return
			}

			c.JSON(http.StatusNotImplemented, gin.H{"error": "GetCountyBySlug not implemented in service"})
		})

		// GET /api/v1/counties/:slug/hierarchy
		v1.GET("/counties/:slug/hierarchy", func(c *gin.Context) {
			slug := c.Param("slug")
			ctx := c.Request.Context()

			if svcApp, ok := svc.(*AppServices); ok && svcApp.County != nil && svcApp.Constituency != nil {
				countyMeta, err := svcApp.County.GetCountyMetadata(ctx, slug)
				if err != nil {
					c.JSON(http.StatusNotFound, gin.H{"error": "county not found"})
					return
				}

				constMeta, err := svcApp.Constituency.ListConstituenciesMetadataByCountySlug(ctx, slug)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve constituencies"})
					return
				}

				type constInfo struct {
					Code string `json:"code"`
					Name string `json:"name"`
				}

				var constituencies []constInfo
				for _, cm := range constMeta {
					constituencies = append(constituencies, constInfo{
						Code: cm.Code,
						Name: cm.Name,
					})
				}

				if constituencies == nil {
					constituencies = []constInfo{}
				}

				c.JSON(http.StatusOK, gin.H{
					"county_code":    countyMeta.Code,
					"county_name":    countyMeta.Name,
					"constituencies": constituencies,
				})
				return
			}

			c.JSON(http.StatusNotImplemented, gin.H{"error": "Hierarchical metadata not implemented"})
		})

		// GET /api/v1/counties/:slug/constituencies
		if svcApp, ok := svc.(*AppServices); ok && svcApp.Constituency != nil {
			ch := NewConstituencyHandler(svcApp.Constituency)
			v1.GET("/counties/:slug/constituencies", ch.ListByCounty)
		} else {
			v1.GET("/counties/:slug/constituencies", func(c *gin.Context) {
				slug := c.Param("slug")
				ctx := c.Request.Context()

				type constSvc interface {
					ListConstituenciesByCountySlug(ctx context.Context, slug string) ([]struct {
						ID       int32
						Slug     string
						Name     string
						Geometry []byte
					}, error)
				}

				if s, ok := svc.(constSvc); ok {
					list, err := s.ListConstituenciesByCountySlug(ctx, slug)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
					fc := buildFeatureCollectionFromConstituencies(list)
					out, _ := json.Marshal(fc)
					c.Data(http.StatusOK, "application/geo+json", out)
					return
				}

				c.JSON(http.StatusNotImplemented, gin.H{"error": "ListConstituenciesByCountySlug not implemented in service"})
			})
		}

		// Sub-counties routes
		if svcApp, ok := svc.(*AppServices); ok && svcApp.SubCounty != nil {
			subCountyHdlr := NewSubCountyHandler(svcApp.SubCounty)
			v1.GET("/sub-counties", subCountyHdlr.ListAll)
			v1.GET("/counties/:slug/sub-counties", subCountyHdlr.ListByCounty)
		} else {
			v1.GET("/sub-counties", func(c *gin.Context) {
				c.JSON(http.StatusNotImplemented, gin.H{"error": "ListAll SubCounties not implemented"})
			})
			v1.GET("/counties/:slug/sub-counties", func(c *gin.Context) {
				c.JSON(http.StatusNotImplemented, gin.H{"error": "ListByCounty SubCounties not implemented"})
			})
		}

		// Wards route
		if svcApp, ok := svc.(*AppServices); ok && svcApp.Ward != nil {
			wardHdlr := NewWardHandler(svcApp.Ward)
			v1.GET("/wards", wardHdlr.ListAll)
		} else {
			v1.GET("/wards", func(c *gin.Context) {
				c.JSON(http.StatusNotImplemented, gin.H{"error": "ListAll Wards not implemented"})
			})
		}

		// Spatial Intersect route
		if svcApp, ok := svc.(*AppServices); ok && svcApp.Spatial != nil {
			spatialHdlr := NewSpatialHandler(svcApp.Spatial)
			v1.POST("/spatial/intersect", spatialHdlr.HandleIntersect)
		} else {
			type spatialSvc interface {
				SpatialIntersect(ctx context.Context, lat, lng float64) (service.SpatialResult, error)
			}
			v1.POST("/spatial/intersect", func(c *gin.Context) {
				var req struct {
					Lat float64 `json:"lat"`
					Lng float64 `json:"lng"`
				}
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
					return
				}
				if s, ok := svc.(spatialSvc); ok {
					res, err := s.SpatialIntersect(c.Request.Context(), req.Lat, req.Lng)
					if err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
					var counties []*domain.County
					if res.County != nil {
						counties = append(counties, res.County)
					}
					fc := buildFeatureCollectionFromCounties(counties)
					out, _ := json.Marshal(fc)
					c.Data(http.StatusOK, "application/geo+json", out)
					return
				}
				c.JSON(http.StatusNotImplemented, gin.H{"error": "SpatialIntersect not implemented in service"})
			})
		}
	}

	// Serve Static Developer Portal (React 19 SPA) with client-side routing fallback
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "./frontend/dist"
	}

	if info, err := os.Stat(staticDir); err == nil && info.IsDir() {
		// Serve static assets directory
		assetsDir := filepath.Join(staticDir, "assets")
		if _, err := os.Stat(assetsDir); err == nil {
			r.Static("/assets", assetsDir)
		}

		// Serve public root assets
		for _, file := range []string{"favicon.ico", "vite.svg", "kenya-flag.svg"} {
			filePath := filepath.Join(staticDir, file)
			if _, err := os.Stat(filePath); err == nil {
				r.StaticFile("/"+file, filePath)
			}
		}

		// SPA Fallback: Any non-API GET route serves index.html so React Router handles navigation
		r.NoRoute(func(c *gin.Context) {
			if c.Request.Method == http.MethodGet && !strings.HasPrefix(c.Request.URL.Path, "/api") && c.Request.URL.Path != "/health" && c.Request.URL.Path != "/__routes" {
				indexPath := filepath.Join(staticDir, "index.html")
				if _, err := os.Stat(indexPath); err == nil {
					c.File(indexPath)
					return
				}
			}
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		})
	}

	return r
}

func buildFeatureCollectionFromCounties(counties []*domain.County) map[string]interface{} {
	features := make([]interface{}, 0, len(counties))
	for _, c := range counties {
		props := map[string]interface{}{
			"id":   c.ID,
			"code": c.Code,
			"name": c.Name,
		}
		features = append(features, buildFeature(c.Geometry, props))
	}
	return map[string]interface{}{
		"type":     "FeatureCollection",
		"features": features,
	}
}

func buildFeatureCollectionFromConstituencies(list []struct {
	ID       int32
	Slug     string
	Name     string
	Geometry []byte
}) map[string]interface{} {
	features := make([]interface{}, 0, len(list))
	for _, it := range list {
		props := map[string]interface{}{
			"id":   it.ID,
			"slug": it.Slug,
			"name": it.Name,
		}
		features = append(features, buildFeature(it.Geometry, props))
	}
	return map[string]interface{}{
		"type":     "FeatureCollection",
		"features": features,
	}
}

func buildFeature(geometry []byte, properties map[string]interface{}) map[string]interface{} {
	var geom json.RawMessage
	if len(geometry) > 0 {
		geom = json.RawMessage(geometry)
	} else {
		geom = json.RawMessage([]byte("null"))
	}
	return map[string]interface{}{
		"type":       "Feature",
		"geometry":   geom,
		"properties": properties,
	}
}
