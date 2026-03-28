"use client";

import { useMemo, useState } from "react";
import MapClient from "@/components/MapClient";
import { sampleMapPlaces, sampleTrip } from "@/lib/sample-trip";

function cardStyle(selected = false): React.CSSProperties {
  return {
    background: "white",
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
    border: selected ? "2px solid #0f172a" : "1px solid #e2e8f0"
  };
}

export default function Page() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [search, setSearch] = useState("");

  const day = sampleTrip.days.find((item) => item.dayNumber === selectedDay) ?? sampleTrip.days[0];
  const filteredItems = useMemo(() => {
    return day.items.filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || (item.placeQuery ?? "").toLowerCase().includes(q);
    });
  }, [day.items, search]);

  const dayDistance = filteredItems.reduce((acc, item) => acc + (item.distanceKm ?? 0), 0);
  const dayDuration = filteredItems.reduce((acc, item) => acc + (item.durationMin ?? 0), 0);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <section style={{ ...cardStyle(), marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>Trip Visualizer</h1>
            <p style={{ margin: "8px 0 0", color: "#475569" }}>
              Upload a PDF or DOCX itinerary and view route distances, mapped stops, images, and recommendations.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button style={{ padding: "12px 16px", borderRadius: 999, border: "none", background: "#0f172a", color: "white" }}>
              Upload PDF / DOCX
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Destination</div><div style={{ fontSize: 22, fontWeight: 700 }}>{sampleTrip.trip.destination}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Travel dates</div><div style={{ fontSize: 22, fontWeight: 700 }}>{sampleTrip.trip.startDate} to {sampleTrip.trip.endDate}</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Filtered day distance</div><div style={{ fontSize: 22, fontWeight: 700 }}>{dayDistance.toFixed(1)} km</div></div>
          <div style={cardStyle()}><div style={{ color: "#64748b", fontSize: 14 }}>Filtered travel time</div><div style={{ fontSize: 22, fontWeight: 700 }}>{dayDuration} min</div></div>
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
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {sampleTrip.days.map((tripDay) => (
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
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
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
            <MapClient places={sampleMapPlaces} selectedDay={selectedDay} />
          </div>

          <div style={cardStyle()}>
            <h2 style={{ marginTop: 0 }}>Recommendation logic for this itinerary</h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: "#475569", lineHeight: 1.6 }}>
              <li>Favor low-detour places near the current stop and next stop.</li>
              <li>Boost child-friendly places because the trip includes a 4-year-old.</li>
              <li>Boost breakfast suggestions in Uluwatu because the booked stay there has no breakfast included.</li>
              <li>Avoid steep or risky add-ons in Nusa Penida.</li>
              <li>Prefer walkable suggestions around central Ubud and the Palace area.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
