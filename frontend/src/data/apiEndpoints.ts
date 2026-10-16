/**
 * Kenya Admin Boundaries REST API Endpoint Registry
 * Centralized data catalog defining routes, parameters, schemas, and sample payloads.
 */

export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
}

export interface EndpointQueryParam {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface Endpoint {
  id: string;
  category: "Counties" | "Constituencies" | "Sub-Counties" | "Wards" | "System";
  method: "GET";
  path: string;
  summary: string;
  description: string;
  params?: EndpointParam[];
  queryParams?: EndpointQueryParam[];
  responseType: "GeoJSON FeatureCollection" | "GeoJSON Feature" | "JSON Object" | "JSON Array";
  sampleResponse: unknown;
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: "get-counties",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties",
    summary: "List all 47 Counties",
    description:
      "Returns a GeoJSON FeatureCollection of all 47 Kenyan county boundaries with PostGIS MultiPolygon geometries and properties.",
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "0",
          properties: { code: "KE001", name: "Mombasa" },
          geometry: { type: "MultiPolygon", coordinates: "[[[[39.64, -4.06], ...]]]]" },
        },
        {
          type: "Feature",
          id: "46",
          properties: { code: "KE047", name: "Nairobi" },
          geometry: { type: "MultiPolygon", coordinates: "[[[[36.82, -1.29], ...]]]]" },
        },
      ],
    },
  },
  {
    id: "get-county-by-slug",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug",
    summary: "Get County Boundary by Code",
    description: "Returns a single GeoJSON Feature representing the specified county boundary polygon.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "The county slug/code (e.g. KE047 for Nairobi, KE001 for Mombasa, KE042 for Kisumu)",
        example: "KE047",
      },
    ],
    responseType: "GeoJSON Feature",
    sampleResponse: {
      type: "Feature",
      id: "46",
      properties: { code: "KE047", name: "Nairobi" },
      geometry: { type: "MultiPolygon", coordinates: "[[[[36.82, -1.29], ...]]]]" },
    },
  },
  {
    id: "get-county-hierarchy",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/hierarchy",
    summary: "Get County Hierarchy & Constituencies",
    description:
      "High-performance endpoint returning the County code and name coupled with an array of its constituent constituencies, completely omitting heavy geometric coordinates.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047",
      },
    ],
    responseType: "JSON Object",
    sampleResponse: {
      county_code: "KE047",
      county_name: "Nairobi",
      constituencies: [
        { code: "KE047274", name: "Westlands" },
        { code: "KE047275", name: "Parklands/Highridge" },
        { code: "KE047276", name: "Dagoretti North" },
        { code: "KE047284", name: "Kibra" },
        { code: "KE047285", name: "Roysambu" },
      ],
    },
  },
  {
    id: "get-county-constituencies",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/constituencies",
    summary: "Get Constituencies within a County",
    description:
      "Returns a GeoJSON FeatureCollection of all parliamentary electoral constituencies belonging to a specific county.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047",
      },
    ],
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "274",
          properties: { code: "KE047274", name: "Westlands", county_code: "KE047" },
          geometry: { type: "MultiPolygon", coordinates: "..." },
        },
      ],
    },
  },
  {
    id: "get-county-subcounties",
    category: "Counties",
    method: "GET",
    path: "/api/v1/counties/:slug/sub-counties",
    summary: "Get Sub-Counties in County",
    description:
      "Returns a lightweight JSON array describing all administrative sub-counties nested within the specified county.",
    params: [
      {
        name: "slug",
        type: "string",
        required: true,
        description: "County code (e.g. KE047)",
        example: "KE047",
      },
    ],
    responseType: "JSON Object",
    sampleResponse: {
      sub_counties: [
        {
          county_code: "KE047",
          county_name: "Nairobi",
          sub_county_code: "4701",
          sub_county_name: "Westlands",
        },
        {
          county_code: "KE047",
          county_name: "Nairobi",
          sub_county_code: "4702",
          sub_county_name: "Dagoretti",
        },
      ],
    },
  },
  {
    id: "get-constituencies",
    category: "Constituencies",
    method: "GET",
    path: "/api/v1/constituencies",
    summary: "List all 290 Constituencies",
    description:
      "Returns a GeoJSON FeatureCollection of all 290 parliamentary electoral constituencies across Kenya.",
    responseType: "GeoJSON FeatureCollection",
    sampleResponse: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "1",
          properties: { code: "KE001001", name: "Changamwe", county_code: "KE001" },
          geometry: { type: "MultiPolygon", coordinates: "..." },
        },
      ],
    },
  },
  {
    id: "get-sub-counties",
    category: "Sub-Counties",
    method: "GET",
    path: "/api/v1/sub-counties",
    summary: "List all 412 Sub-Counties",
    description: "Returns a comprehensive JSON listing of all 412 national administrative sub-counties in Kenya.",
    responseType: "JSON Object",
    sampleResponse: {
      sub_counties: [
        {
          county_code: "KE001",
          county_name: "Mombasa",
          sub_county_code: "0101",
          sub_county_name: "Changamwe",
        },
      ],
    },
  },
  {
    id: "get-wards",
    category: "Wards",
    method: "GET",
    path: "/api/v1/wards",
    summary: "List 1,450 Wards (Paginated)",
    description:
      "Returns a paginated list of political wards throughout Kenya, including associated constituency and county metadata.",
    queryParams: [
      {
        name: "page",
        type: "integer",
        required: false,
        default: "1",
        description: "Page number for pagination",
      },
      {
        name: "limit",
        type: "integer",
        required: false,
        default: "50",
        description: "Number of records per page (max 100)",
      },
    ],
    responseType: "JSON Array",
    sampleResponse: [
      {
        ward_code: "0001",
        ward_name: "Port Reitz",
        constituency_code: "001",
        county_code: "KE001",
      },
    ],
  },
  {
    id: "get-health",
    category: "System",
    method: "GET",
    path: "/health",
    summary: "System Health & Uptime",
    description: "Sanity health check verifying the API service is active and responsive.",
    responseType: "JSON Object",
    sampleResponse: {
      env: "development",
      status: "API is up and running!",
    },
  },
];
