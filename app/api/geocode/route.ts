import { NextRequest, NextResponse } from "next/server";
import { buildGeocodeCandidates, hydrateMapPlace } from "@/lib/map-utils";
import { normalizeTripPayload } from "@/lib/trip-utils";
import type { MapPlace, TripPayload } from "@/lib/types";

type GeocodeResult = {
  lat: number;
  lng: number;
  address: string;
};

async function geocodeWithMapbox(query: string, token: string): Promise<GeocodeResult | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number]; place_name?: string }>;
  };
  const feature = payload.features?.[0];
  const center = feature?.center;

  if (!center || center.length < 2) return null;

  return {
    lng: center[0],
    lat: center[1],
    address: feature?.place_name ?? query
  };
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "trip-visualizer/1.0"
    }
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const result = payload[0];
  if (!result?.lat || !result.lon) return null;

  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    address: result.display_name ?? query
  };
}

async function geocode(query: string): Promise<GeocodeResult | null> {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    const mapboxResult = await geocodeWithMapbox(query, mapboxToken);
    if (mapboxResult) return mapboxResult;
  }

  return geocodeWithNominatim(query);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { trip?: TripPayload };
    if (!body.trip) {
      return NextResponse.json({ error: "Missing trip payload" }, { status: 400 });
    }

    const trip = normalizeTripPayload(body.trip);
    const candidates = buildGeocodeCandidates(trip);
    const places: MapPlace[] = [];

    for (const candidate of candidates) {
      const result = await geocode(candidate.query);
      if (!result) continue;
      places.push(hydrateMapPlace(candidate, result.lat, result.lng, result.address));
    }

    return NextResponse.json({
      places,
      warning: places.length === 0 ? "No map locations could be resolved for this DOCX itinerary." : null
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}