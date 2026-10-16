/**
 * Centralized content payload and source-of-truth for the Kenya Admin Boundaries Portal.
 * Separates data from presentation layer (DRY, Clean Architecture).
 */

export interface TelemetryStat {
  id: string;
  label: string;
  value: string;
  unit: string;
  description: string;
}

export interface TechSpecTab {
  id: "clean_arch" | "postgis" | "redis";
  number: string;
  title: string;
  narrative: string;
  terminalContext: string;
  codeSnippet: string;
  statusLabel: string;
}

export const HERO_CONTENT = {
  versionBadge: "GEOSPATIAL REST API // v1.0.0",
  titlePrimary: "KENYA ADMINISTRATIVE",
  titleAccent: "BOUNDARIES API",
  description:
    "A production-grade geospatial REST engine delivering accurate administrative and electoral boundaries down to the constituency level. Engineered with Golang 1.25 Clean Architecture, PostGIS 3.3 spatial indexing, and Redis 7 in-memory caching.",
  quickCurl: "curl -s http://localhost:18080/api/v1/counties | jq .",
  primaryCta: {
    label: "Explore API Docs & Console",
    path: "/docs",
  },
  secondaryCta: {
    label: "Launch Map Explorer",
    path: "/map",
  },
};

export const TELEMETRY_STATS: TelemetryStat[] = [
  {
    id: "counties",
    label: "COUNTIES",
    value: "47",
    unit: "GeoJSON MultiPolygons",
    description: "First-order administrative units with full polygon boundaries.",
  },
  {
    id: "constituencies",
    label: "CONSTITUENCIES",
    value: "290",
    unit: "Parliamentary Bounds",
    description: "National electoral constituencies mapped to EPSG:4326.",
  },
  {
    id: "sub_counties",
    label: "SUB-COUNTIES",
    value: "412",
    unit: "Administrative Units",
    description: "Decentralized national administration sub-units.",
  },
  {
    id: "wards",
    label: "WARDS",
    value: "1,450",
    unit: "Electoral Wards",
    description: "Granular civic representation boundaries across all 47 counties.",
  },
  {
    id: "latency",
    label: "CACHE LATENCY",
    value: "< 1.2ms",
    unit: "Redis 7 In-Memory",
    description: "Pre-computed polygon representations served from memory.",
  },
  {
    id: "spatial_index",
    label: "SPATIAL INDEX",
    value: "2D GIST",
    unit: "PostGIS 3.3 Engine",
    description: "Bounding-box filter intersections executing in under 1ms.",
  },
];

export const TECHNICAL_SPECS: TechSpecTab[] = [
  {
    id: "clean_arch",
    number: "01.",
    title: "GOLANG CLEAN ARCHITECTURE",
    narrative:
      "Strict decoupling between domain entities, sqlc type-safe repositories, caching interfaces, and HTTP transport handlers.",
    terminalContext: "bash: ~/kenya-api/routes.sh",
    statusLabel: "ACTIVE",
    codeSnippet: `// REST API Core Route Registry & GeoJSON Output
GET  /api/v1/counties                     GeoJSON FeatureCollection (47)
GET  /api/v1/counties/:slug               GeoJSON Feature (Single Polygon)
GET  /api/v1/counties/:slug/hierarchy     JSON { county, constituencies }
GET  /api/v1/counties/:slug/constituencies GeoJSON FeatureCollection
GET  /api/v1/constituencies               GeoJSON FeatureCollection (290)
GET  /api/v1/sub-counties                 JSON Array (412 Units)
GET  /api/v1/wards                        JSON Array (1,450 Wards)`,
  },
  {
    id: "postgis",
    number: "02.",
    title: "POSTGIS 3.3 SPATIAL INDEXING",
    narrative:
      "2D GIST indexes enable sub-millisecond bounding box filtering and ST_Intersects spatial polygon containment checks.",
    terminalContext: "psql: spatial_pg (postgis 3.3)",
    statusLabel: "ACTIVE",
    codeSnippet: `-- High-Performance 2D GIST Spatial Intersection Query
SELECT county_code, county_name,
  ST_AsGeoJSON(geom)::json AS geometry
FROM counties
WHERE ST_Intersects(geom, ST_MakeEnvelope(34.0, -4.5, 42.0, 5.0, 4326));

Index Scan: idx_counties_geom_gist on counties (cost=0.14..8.25)
Execution Time: 0.428 ms (sub-millisecond spatial lookup)`,
  },
  {
    id: "redis",
    number: "03.",
    title: "REDIS IN-MEMORY DISTRIBUTION",
    narrative:
      "Pre-computed GeoJSON representations cached with fixed-window rate limiting to ensure 99.99% uptime under high traffic.",
    terminalContext: "redis-cli: spatial_redis (in-memory)",
    statusLabel: "ACTIVE",
    codeSnippet: `# Redis 7 In-Memory Multi-Tier Spatial Cache
$ redis-cli -p 6379
127.0.0.1:6379> GET geo:county:KE047:geojson
-> [CACHE HIT] 48,210 bytes in-memory buffer
127.0.0.1:6379> TTL geo:county:KE047:geojson
-> (integer) 84312 [23h 25m remaining]
127.0.0.1:6379> LATENCY latest
-> "geo:county:*" 0.82ms latency`,
  },
];

export const FOOTER_CONTENT = {
  brand: "KENYA ADMIN BOUNDARIES API",
  type: "OPEN SOURCE GEOSPATIAL PLATFORM",
  coordinateSystem: "WGS 84 (EPSG:4326)",
  githubUrl: "https://github.com/paulakelo/kenya-admin-boundaries-api",
  links: [
    { label: "API Reference", path: "/docs" },
    { label: "Map Explorer", path: "/map" },
    { label: "GitHub", href: "https://github.com/paulakelo/kenya-admin-boundaries-api", external: true },
  ],
};
