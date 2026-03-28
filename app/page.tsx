"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MapClient from "@/components/MapClient";
import type { MapPlace, TripPayload } from "@/lib/types";

function cardStyle(selected = false): React.CSSProperties {
  return {
    background: "white",
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
    border: selected ? "2px solid #0f172a" : "1px solid #e2e8f0"
  };
}

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message: string | null;
};

export default function Page() {
  const [trip, setTrip] = useState<TripPayload | null>(null);
  const [mapPlaces, setMapPlaces] = useState<MapPlace[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [search, setSearch] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle", message: null });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const days = trip?.days ?? [];

  useEffect(() => {
    if (days.length > 0 && !days.some((item) => item.dayNumber === selectedDay)) {
      setSelectedDay(days[0]?.dayNumber ?? 1);
    }
  }, [days, selectedDay]);

  const day = days.find((item) => item.dayNumber === selectedDay) ?? days[0];
  const dayItems = day?.items ?? [];
  const filteredItems = useMemo(() => {
    return dayItems.filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.placeQuery ?? "").toLowerCase().includes(q);
    });
  }, [dayItems, search]);

  const dayDistance = filteredItems.reduce((acc, item) => acc + (item.distanceKm ?? 0), 0);
  const dayDuration = filteredItems.reduce((acc, item) => acc + (item.durationMin ?? 0), 0);
  const selectedDayPlaces = mapPlaces.filter((place) => place.dayNumber === selectedDay);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".docx")) {
      setUploadState({ status: "error", message: "Only DOCX uploads are supported right now." });
      event.target.value = "";
      return;
    }

    setUploadState({ status: "uploading", message: `Uploading ${file.name}...` });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed");
      }

      const nextTrip = payload.trip;
      if (!nextTrip) {
        throw new Error("No trip data was returned from the upload.");
      }

      setTrip(nextTrip);
      setSelectedDay(nextTrip.days[0]?.dayNumber ?? 1);
      setMapPlaces([]);
      setSearch("");
      setUploadState({ status: "uploading", message: `Extracted ${file.name}. Mapping itinerary...` });

      const geocodeResponse = await fetch("/api/geocode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ trip: nextTrip })
      });
      const geocodePayload = await geocodeResponse.json();

      if (!geocodeResponse.ok) {
        throw new Error(geocodePayload.error ?? "The itinerary was extracted but map geocoding failed.");
      }

      setMapPlaces(geocodePayload.places ?? []);
      setUploadState({
        status: "success",
        message: geocodePayload.warning ?? `Loaded ${file.name} and mapped the extracted itinerary.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadState({ status: "error", message });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <section style={{ ...cardStyle(), marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>Trip Visualizer</h1>
            <p style={{ margin: "8px 0 0", color: "#475569" }}>
              Upload a DOCX itinerary and turn it into a day-by-day travel timeline with a live route map.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadState.status === "uploading"}
              style={{
                padding: "12px 16px",
                borderRadius: 999,
                border: "none",
                background: "#0f172a",
                color: "white",
                opacity: uploadState.status === "uploading" ? 0.7 : 1,
                cursor: uploadState.status === "uploading" ? "wait" : "pointer"
              }}
            >
              {uploadState.status === "uploading" ? "Processing..." : "Upload DOCX"}
            </button>
          </div>
        </div>
        {uploadState.message && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 16,
              background: uploadState.status === "error" ? "#fef2f2" : "#f8fafc",
              color: uploadState.status === "error" ? "#991b1b" : "#334155"
            }}
          >
            {uploadState.message}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Destination</div><div style={{ fontSize: 22, fontWeight: 700 }}>{trip?.trip.destination ?? "Upload a DOCX"}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Travel dates</div><div style={{ fontSize: 22, fontWeight: 700 }}>{trip ? `${trip.trip.startDate} to ${trip.trip.endDate}` : "Waiting for itinerary"}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Trip days</div><div style={{ fontSize: 22, fontWeight: 700 }}>{trip?.days.length ?? 0}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Mapped stops</div><div style={{ fontSize: 22, fontWeight: 700 }}>{mapPlaces.length}</div></div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(320px, 0.9fr) minmax(360px, 1.1fr)", gap: 16 }}>
        <div style={cardStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>Timeline</h2>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search places"
              style={{ padding: "10px 12px", minWidth: 220, borderRadius: 12, border: "1px solid #cbd5e1" }}
              disabled={!trip}
            />
          </div>
          {trip ? <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {days.map((tripDay) => (
              <button
                key={tripDay.dayNumber}
                onClick={() => setSelectedDay(tripDay.dayNumber)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: selectedDay === tripDay.dayNumber ? "none" : "1px solid #cbd5e1",
                  background: selectedDay === tripDay.dayNumber ? "#0f172a" : "white",
                  color: selectedDay === tripDay.dayNumber ? "white" : "#0f172a"
                }}
              >
                Day {tripDay.dayNumber}
              </button>
            ))}
          </div> : null}

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {!trip && (
              <div style={cardStyle()}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Upload a DOCX itinerary to begin</div>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  The app will extract days, flights, stays, and activities from your document and visualize them here.
                </p>
              </div>
            )}
            {trip && filteredItems.length === 0 && (
              <div style={cardStyle()}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>No itinerary items for this filter</div>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>
                  Try a different search or choose another day.
                </p>
              </div>
            )}
            {filteredItems.map((item) => (
              <div key={item.id} style={cardStyle()}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>{item.category}</div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{item.name}</div>
                    <div style={{ marginTop: 4, color: "#475569" }}>{item.placeQuery}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{item.timeLabel ?? "Flexible"}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {item.distanceKm !== null && <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f1f5f9" }}>{item.distanceKm} km</span>}
                  {item.durationMin !== null && <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f1f5f9" }}>{item.durationMin} min</span>}
                  {item.tags.map((tag) => <span key={tag} style={{ padding: "6px 10px", borderRadius: 999, background: "#f8fafc", border: "1px solid #e2e8f0" }}>{tag}</span>)}
                </div>
                {item.notes.length > 0 && <p style={{ margin: "12px 0 0", color: "#475569" }}>{item.notes[0]}</p>}
                {item.warnings.length > 0 && <p style={{ margin: "8px 0 0", color: "#991b1b" }}>Warning: {item.warnings.join(" · ")}</p>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Map</h2>
            <MapClient places={mapPlaces} selectedDay={selectedDay} />
            {trip && selectedDayPlaces.length === 0 && mapPlaces.length > 0 && (
              <p style={{ margin: "12px 0 0", color: "#475569" }}>
                No mapped stops were resolved for the selected day, but other trip locations were found.
              </p>
            )}
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Extracted Trip Context</h2>
            {trip ? (
              <div style={{ display: "grid", gap: 10, color: "#475569" }}>
                <div><strong style={{ color: "#0f172a" }}>Source document:</strong> {trip.source.fileName}</div>
                <div><strong style={{ color: "#0f172a" }}>Travelers:</strong> {trip.trip.travelers.summary}</div>
                <div><strong style={{ color: "#0f172a" }}>Route:</strong> {trip.trip.routeRegions.map((region) => `${region.name} (${region.nights} nights)`).join(" -> ")}</div>
                <div><strong style={{ color: "#0f172a" }}>Filtered day distance:</strong> {dayDistance.toFixed(1)} km</div>
                <div><strong style={{ color: "#0f172a" }}>Filtered travel time:</strong> {dayDuration} min</div>
              </div>
            ) : (
              <p style={{ margin: 0, color: "#475569" }}>
                Once you upload a DOCX itinerary, this panel will reflect the parsed trip details instead of static starter content.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
