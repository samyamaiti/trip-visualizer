"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapPlace } from "@/lib/sample-trip";

interface MapClientProps {
  places: MapPlace[];
  selectedDay: number;
}

export default function MapClient({ places, selectedDay }: MapClientProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [115.1889, -8.4095],
      zoom: 9
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
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
  }, [token]);

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
      (map.getSource(pointsId) as mapboxgl.GeoJSONSource).setData(pointsData as never);
    } else {
      map.addSource(pointsId, { type: "geojson", data: pointsData as never });
      map.addLayer({
        id: pointsId,
        type: "circle",
        source: pointsId,
        paint: {
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });
    }

    if (map.getSource(routeId)) {
      (map.getSource(routeId) as mapboxgl.GeoJSONSource).setData(routeData as never);
    } else {
      map.addSource(routeId, { type: "geojson", data: routeData as never });
      map.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        paint: {
          "line-width": 4,
          "line-opacity": 0.9
        }
      });
    }

    const bounds = new mapboxgl.LngLatBounds();
    dayPlaces.forEach((place) => bounds.extend([place.lng, place.lat]));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, duration: 500 });
    }
  }, [mapReady, places, selectedDay]);

  if (!token) {
    return (
      <div style={{ height: 420, display: "grid", placeItems: "center", background: "#f1f5f9", borderRadius: 24 }}>
        Add NEXT_PUBLIC_MAPBOX_TOKEN to render the live map.
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
