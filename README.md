# Kenya Admin Boundaries API

A production-grade geospatial REST engine and developer portal delivering administrative and electoral boundaries across Kenya down to the constituency and ward levels.

Engineered with Golang 1.25 Clean Architecture, PostGIS 3.3 2D GIST spatial indexing, Redis 7 multi-tier caching, and a WCAG 2.1 AA compliant Developer Portal.

---

## System Capabilities & Telemetry

* **47 Counties:** Standardized WGS 84 (EPSG:4326) GeoJSON MultiPolygon geometries and official codes.
* **290 Constituencies:** National parliamentary electoral boundary polygons.
* **412 Sub-Counties:** Decentralized national administrative units.
* **1,450 Wards:** Civic representation units with parent hierarchy mapping.
* **Sub-Millisecond Spatial Lookups:** PostGIS 2D GIST bounding-box indexing.
* **Multi-Tier In-Memory Cache:** Redis 7 caching layer for high-throughput GeoJSON payload delivery.

---

## Tech Stack & Architecture

### Backend Engine

* **Language:** Golang 1.25 (Strict Clean Architecture isolating Domain, Repository, Service, and HTTP Handlers)
* **Web Framework:** Gin Web Framework
* **Spatial Database:** PostgreSQL 15 + PostGIS 3.3
* **In-Memory Cache:** Redis 7 (24h TTL with fixed-window rate limiting)
* **Type-Safe Queries:** `sqlc` for compile-time verified SQL execution
* **Migrations:** `golang-migrate` for version-controlled PostGIS schemas
* **Containerization:** Docker & Docker Compose

### Frontend Developer Portal

* **Core:** React 19, TypeScript, Vite 7
* **Styling & Design System:** Tailwind CSS v4 with a 3-tier design token scale, strict 8px spatial grid, and off-black surface layering (`#111216`, `#181920`, `#22242F`) to eliminate astigmatism halation
* **Mapping Engine:** Leaflet & React-Leaflet with multi-basemap support (Esri World Dark Canvas, OpenStreetMap Standard, Esri Satellite)
* **Icons & Components:** Lucide Icons & Radix UI / shadcn primitives
* **Accessibility:** WCAG 2.1 AA compliant semantic DOM landmarks, sequential heading hierarchy, and full keyboard `:focus-visible` navigation

---

## Repository Structure

```text
├── backend/
│   ├── cmd/api/main.go               # Dependency injection & HTTP server bootstrap
│   └── sql/queries.sql               # Raw SQL statements compiled by sqlc
├── internal/
│   ├── domain/                       # Core domain models (County, Constituency, SubCounty, Ward)
│   ├── handler/                      # HTTP transport layer & route definitions
│   ├── repository/postgres/          # sqlc-generated type-safe PostgreSQL/PostGIS repositories
│   └── service/                      # Business logic & caching interfaces
├── frontend/                         # React 19 Developer Portal & Map Explorer
│   ├── src/
│   │   ├── components/               # Modular presentation components (Landing, Map, Sidebar)
│   │   ├── data/                     # Centralized content & API endpoint specifications (DRY)
│   │   └── views/                    # Top-level route orchestrators (LandingPage, ApiDocs, Playground)
├── migrations/                       # PostGIS database schema migrations
├── docker-compose.yml                # Production orchestration definitions
└── docker-compose.override.yml       # Local development overrides & container configuration
```

---

## Getting Started

### Prerequisites

* Docker & Docker Compose (v2.20+)
* Node.js 20+ and npm (for frontend development)
* Go 1.25+ (for local backend development without Docker)

### 1. Launch Infrastructure via Docker

Start the PostGIS database, Redis cache, and Go REST API with a single command:

```bash
docker compose up -d
```

Verify service status:

* **Go REST API:** `http://localhost:18080/health`
* **API Route Index:** `http://localhost:18080/__routes`
* **PostgreSQL / PostGIS:** Port `5432`
* **Redis 7 Cache:** Port `6379`

### 2. Launch Developer Portal Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

---

## Portal Routing & Experiences

* **Developer Landing Page (`/`):** High-impact entry point featuring real-time telemetry metrics, a Golang Clean Architecture & PostGIS terminal showcase, and 1-click cURL quickstart snippets.
* **Interactive API Docs & Test Console (`/docs`):** Complete REST reference for all 8 endpoints with real-time query execution against `localhost:18080`, parameter inputs, JSON response inspection, and multi-language code generators (cURL, JavaScript, Python, Go).
* **Geospatial Map Explorer (`/map`):** Interactive boundary map with multi-basemap switching (Esri Dark Gray, OSM, Satellite), county search filtering, and constituency polygon zoom.

---

## API Reference

Base URL: `http://localhost:18080/api/v1`

| Method | Endpoint | Description | Output Format |
| :--- | :--- | :--- | :--- |
| `GET` | `/counties` | Returns all 47 counties with full spatial polygons | GeoJSON FeatureCollection |
| `GET` | `/counties/:slug` | Returns a single county boundary polygon | GeoJSON Feature |
| `GET` | `/counties/:slug/hierarchy` | Lightweight county details and constituency names (no heavy geometries) | JSON Object |
| `GET` | `/counties/:slug/constituencies` | All electoral constituencies in a county | GeoJSON FeatureCollection |
| `GET` | `/counties/:slug/sub-counties` | All administrative sub-counties in a county | JSON Array |
| `GET` | `/constituencies` | Returns all 290 national parliamentary constituencies | GeoJSON FeatureCollection |
| `GET` | `/sub-counties` | Returns all 412 national administrative sub-counties | JSON Array |
| `GET` | `/wards` | Returns paginated electoral wards (`?page=1&limit=50`) | JSON Array |
| `GET` | `/health` | System uptime, Redis status, and database connectivity | JSON Object |

---

## Verification & Code Quality

Automated tests and linters are enforced across the repository:

```bash
# Frontend ESLint verification
npm --prefix frontend run lint

# Frontend production compilation
npm --prefix frontend run build

# Markdown documentation linting
npx markdownlint-cli README.md CHECKLIST.md
```

---

## Data Sources & Attributions

The spatial geometries, administrative hierarchies, and electoral boundaries utilized in this project are sourced and cross-referenced from official government and humanitarian open datasets with explicit publication and census years:

1. **Kenya National Bureau of Statistics (KNBS) [2019]:**
   * *2019 Kenya Population and Housing Census (KPHC Volume 1: Administrative Units)*, published November 2019. Established official codes and boundaries for Kenya's 47 Counties and 412 Sub-Counties.
2. **Independent Electoral and Boundaries Commission (IEBC) [2012 / 2022]:**
   * *National Delimitation of Constituencies and Wards*, originally gazetted in 2012 (Gazette Vol. CXIV—No. 18) under the Constitution of Kenya (2010), and verified for the 2017 & 2022 General Elections. Delineates Kenya's 290 parliamentary constituencies and 1,450 county assembly wards.
3. **United Nations Office for the Coordination of Humanitarian Affairs (UN OCHA) / HDX [2020 / 2022]:**
   * *Kenya Common Operational Datasets on Administrative Boundaries (COD-AB)*, published in 2020 and updated in 2022. Provides standardized administrative polygons (Admin Levels 0–3) projected in WGS 84 (EPSG:4326).
4. **Survey of Kenya (SoK) / Ministry of Lands and Physical Planning [2013 / 2019]:**
   * *National Topographical and Cadastral Survey Guidelines & Devolution Gazettement (2013)*, harmonized with the 2019 administrative census adjustments.
5. **Esri & OpenStreetMap Contributors [2024–2026]:**
   * World Dark Canvas, OpenStreetMap, and World Satellite imagery basemap tile services (accessed 2024–2026) provided for cartographic visualization in the Interactive Map Explorer.

---

## License

This project is licensed under the [MIT License](file:///home/paula/Projects/kenya-admin-boundaries-api/LICENSE).
