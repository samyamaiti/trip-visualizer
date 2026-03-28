"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapPlace } from "@/lib/types";

interface MapClientProps {
  places: MapPlace[];
  selectedDay: number;
}

export default function MapClient({ places, selectedDay }: MapClientProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors"
          }
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm"
          }
        ]
      },
      center: [115.1889, -8.4095],
      zoom: 9
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.once("load", () => {
      setMapReady(true);
      setMapError(null);
    });
    map.on("error", () => {
      setMapError("The live map could not be loaded.");
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const dayPlaces = places.filter(
      (place) =>
        place.dayNumber === selectedDay &&
        Number.isFinite(place.lng) &&
        Number.isFinite(place.lat)
    );
    const features = dayPlaces.map((place) => ({
      type: "Feature" as const,
      properties: {
        name: place.name,
        timeLabel: place.timeLabel ?? "Flexible",
        address: place.address
      },
      geometry: {
        type: "Point" as const,
        coordinates: [place.lng, place.lat]
      }
    }));

    const pointsId = "places";
    const routeId = "route";
    const pointsData = { type: "FeatureCollection" as const, features };
    const routeCoordinates = dayPlaces.map((place) => [place.lng, place.lat] as [number, number]);
    const routeData = {
      type: "FeatureCollection" as const,
      features:
        routeCoordinates.length >= 2
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: routeCoordinates
                },
                properties: {}
              }
            ]
          : []
    };

    if (!map.isStyleLoaded()) return;

    if (map.getSource(pointsId)) {
      (map.getSource(pointsId) as maplibregl.GeoJSONSource).setData(pointsData as never);
    } else {
      map.addSource(pointsId, { type: "geojson", data: pointsData as never });
      map.addLayer({
        id: pointsId,
        type: "circle",
        source: pointsId,
        paint: {
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-color": "#0f172a"
        }
      });
    }

    if (map.getSource(routeId)) {
      (map.getSource(routeId) as maplibregl.GeoJSONSource).setData(routeData as never);
    } else {
      map.addSource(routeId, { type: "geojson", data: routeData as never });
      map.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        paint: {
          "line-width": 4,
          "line-opacity": 0.9,
          "line-color": "#2563eb"
        }
      });
    }

    const bounds = new maplibregl.LngLatBounds();
    dayPlaces.forEach((place) => bounds.extend([place.lng, place.lat]));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, duration: 500 });
    }
  }, [mapReady, places, selectedDay]);

  if (places.length === 0) {
    return (
      <div style={{ height: 420, display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: 24 }}>
        Upload a DOCX itinerary to render the live map.
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{ height: 420, display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: 24, color: "#475569" }}>
        {mapError}
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: 420, width: "100%", borderRadius: 24, overflow: "hidden" }} />;
}
