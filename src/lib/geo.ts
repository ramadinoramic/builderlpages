import { type NextRequest } from "next/server";

export interface GeoInfo {
  country: string | null;
  city: string | null;
}

export function getGeoFromHeaders(request: NextRequest): GeoInfo {
  return {
    country:
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null,
    city:
      request.headers.get("x-vercel-ip-city") ??
      request.headers.get("cf-ipcity") ??
      null,
  };
}
