package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	db "github.com/paula-dot/kenya-admin-boundaries-api/internal/repository/postgres"
)

// SpatialService acts as the bridge between the Gin handler and the Postgres engine
type SpatialService struct {
	queries *db.Queries
	cache   CacheRepository
}

// NewSpatialService initializes the service with database access and an abstract cache
func NewSpatialService(q *db.Queries, cache CacheRepository) *SpatialService {
	return &SpatialService{
		queries: q,
		cache:   cache,
	}
}

// IntersectResponse represents the clean JSON payload returned to the client
type IntersectResponse struct {
	CountyCode       string `json:"county_code"`
	CountyName       string `json:"county_name"`
	ConstituencyCode string `json:"constituency_code"`
	ConstituencyName string `json:"constituency_name"`
}

// GetIntersection transforms the raw coordinates into a location payload
func (s *SpatialService) GetIntersection(ctx context.Context, lat, lon float64) (*IntersectResponse, error) {
	// Security & Safety: Basic bounds validation to prevent database strain
	if lat < -90 || lat > 90 || lon < -180 || lon > 180 {
		return nil, errors.New("invalid coordinates: latitude must be between -90 and 90, and longitude between -180 and 180")
	}

	// 1. Generate Cache Key (Round to 4 decimal places for ~11m precision)
	cacheKey := fmt.Sprintf("spatial:intersect:lat=%.4f:lon=%.4f", lat, lon)

	// 2. Try Cache
	if s.cache != nil {
		cachedResult, err := s.cache.Get(ctx, cacheKey)
		if err == nil && cachedResult != nil {
			var cachedResp IntersectResponse
			if err := json.Unmarshal(cachedResult, &cachedResp); err == nil {
				return &cachedResp, nil
			}
		}
	}

	// 3. PostGIS Query
	params := db.GetIntersectingBoundaryParams{
		Longitude: lon,
		Latitude:  lat,
	}

	row, err := s.queries.GetIntersectingBoundary(ctx, params)
	if err != nil {
		return nil, err
	}

	resp := &IntersectResponse{
		CountyCode:       row.CountyCode,
		CountyName:       row.CountyName,
		ConstituencyCode: row.ConstituencyCode,
		ConstituencyName: row.ConstituencyName,
	}

	// 4. Save to Cache asynchronously
	if s.cache != nil {
		if outBytes, err := json.Marshal(resp); err == nil {
			go func(ctx context.Context, key string, b []byte) {
				_ = s.cache.Set(ctx, key, b, 24*time.Hour)
			}(context.Background(), cacheKey, outBytes)
		}
	}

	return resp, nil
}

// GetLocationByCoordinates checks the cache first, then falls back to PostGIS
// and returns a generic FeatureCollection-like structure (interface{}) so handlers
// can marshal as GeoJSON if needed.
func (s *SpatialService) GetLocationByCoordinates(ctx context.Context, lon, lat float64) (interface{}, error) {
	// 1. Generate Cache Key (Round to 4 decimal places for ~11m precision)
	cacheKey := fmt.Sprintf("spatial:lookup:%.4f:%.4f", lon, lat)

	// 2. Try to fetch from Cache
	if s.cache != nil {
		cachedResult, err := s.cache.Get(ctx, cacheKey)
		if err == nil && cachedResult != nil {
			var hitResult interface{}
			if err := json.Unmarshal(cachedResult, &hitResult); err == nil {
				return hitResult, nil
			}
		}
	}

	// 3. Fallback to PostGIS on cache miss
	params := db.GetIntersectingBoundaryParams{Longitude: lon, Latitude: lat}
	row, err := s.queries.GetIntersectingBoundary(ctx, params)
	if err != nil {
		return nil, err
	}

	// Build a minimal FeatureCollection-like structure from the DB row
	dbResult := map[string]interface{}{
		"type": "FeatureCollection",
		"features": []interface{}{
			map[string]interface{}{
				"county_code":       row.CountyCode,
				"county_name":       row.CountyName,
				"constituency_code": row.ConstituencyCode,
				"constituency_name": row.ConstituencyName,
			},
		},
	}

	// Serialize the PostGIS result to JSON
	resultJSON, marshalErr := json.Marshal(dbResult)
	if marshalErr != nil {
		return nil, fmt.Errorf("failed to marshal db result: %w", marshalErr)
	}

	// 4. Save to cache
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, resultJSON, 24*time.Hour)
	}

	return dbResult, nil
}
