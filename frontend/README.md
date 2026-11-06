# Kenya Administrative Boundaries — Frontend Developer Portal (`kenya-admin-ui`)

A high-performance Developer Portal and Geospatial Explorer for Kenya's administrative and electoral boundaries, built with React 19, TypeScript, Vite 7, and Tailwind CSS v4.

---

## Features & Architecture

* **API-First Developer Landing Page (`/`):** Telemetry dashboard showcasing live administrative coverage (47 counties, 290 constituencies, 412 sub-counties, 1,450 wards) with quickstart code snippets.
* **Interactive API Documentation & Console (`/docs`):** Swagger/Postman-grade API console allowing developers to test endpoints in real time against the backend with automatic parameter inputs, JSON syntax highlighting, and multi-language code generators (cURL, JavaScript, Python, Go).
* **Interactive Geospatial Map Explorer (`/map`):** Dynamic boundary visualization using Leaflet and React-Leaflet with county search filtering, constituency polygon zoom, and multi-basemap switching (Esri World Dark Canvas, OpenStreetMap Standard, Esri Satellite).
* **Nexus Design System:** WCAG 2.1 AA compliant dark-mode interface featuring a 3-tier off-black surface layering (`#111216`, `#181920`, `#22242F`) to eliminate astigmatism halation, a strict 8px spatial grid, and an Electric Lime developer accent (`#C4F82A`).

---

## Directory Structure

```text
frontend/
├── public/                    # Static assets, fonts, icons, and basemap markers
├── src/
│   ├── components/            # Reusable UI primitives and section components
│   │   ├── Landing.tsx        # Hero banner, telemetry HUD, quickstart snippets
│   │   ├── Map.tsx            # Leaflet map container and GeoJSON layer renderers
│   │   └── Sidebar.tsx        # Collapsible boundary search and administrative hierarchy drawer
│   ├── data/                  # Centralized data definitions (DRY)
│   │   ├── apiEndpoints.ts    # Comprehensive API endpoint metadata and parameter schemas
│   │   └── portalContent.ts   # Copywriting, telemetry metrics, and technical specifications
│   ├── views/                 # Top-level client route views
│   │   ├── LandingPage.tsx    # Root landing experience
│   │   ├── ApiDocs.tsx        # Interactive API documentation & live query console
│   │   └── Playground.tsx     # Map explorer with boundary hierarchy sidebar
│   ├── App.tsx                # App routing layout and global header
│   ├── index.css              # Tailwind CSS v4 token definitions and utility classes
│   └── main.tsx               # React 19 application entry point
├── package.json               # Dependencies and build scripts
└── vite.config.ts             # Vite 7 build configuration with Tailwind plugin
```

---

## Environment Configuration

The frontend dynamically resolves its API backend using the `VITE_API_BASE_URL` environment variable:

```bash
# Optional: Set in .env or during build (defaults to "/api/v1")
VITE_API_BASE_URL=/api/v1
```

* **Production (Unified Container):** When served by the Go backend on port `18080`, `VITE_API_BASE_URL` defaults to relative `/api/v1`. This guarantees **same-origin requests**, eliminating CORS preflight `OPTIONS` requests entirely.
* **Standalone Development:** If running Vite separately from the backend on port `5173`, create a `.env.local` file:
  ```env
  VITE_API_BASE_URL=http://localhost:18080/api/v1
  ```

---

## Development & Build Commands

All commands should be executed from within the `frontend/` directory (or with `--prefix frontend`):

```bash
# Install dependencies
npm install

# Start local Vite development server with HMR
npm run dev

# Run TypeScript type check and production bundle build
npm run build

# Run ESLint validation
npm run lint

# Preview the built production bundle locally
npm run preview
```

---

## Accessibility & Standards

* **Semantic HTML5:** Built with native landmarks (`<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<footer>`).
* **Keyboard Navigation:** Explicit `:focus-visible` focus rings across all tabs, buttons, accordion triggers, and inputs.
* **Astigmatism Protection:** Avoids pure `#000000` on `#FFFFFF` high-contrast jarring by using balanced off-black surface layering.
