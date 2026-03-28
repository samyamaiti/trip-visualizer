import type { MapPlace, Stay, TripPayload } from "@/lib/types";

type GeocodeCandidate = Omit<MapPlace, "lat" | "lng" | "image"> & {
  query: string;
};

function matchingStayForDate(date: string, stays: Stay[]): Stay | undefined {
  return stays.find((stay) => date >= stay.checkInDate && date < stay.checkOutDate);
}

export function buildGeocodeCandidates(trip: TripPayload): GeocodeCandidate[] {
  const candidates: GeocodeCandidate[] = [];
  const seen = new Set<string>();
  const daysWithCandidates = new Set<number>();

  for (const day of trip.days) {
    for (const item of day.items) {
      if (item.category === "note" || item.tags.includes("placeholder")) {
        continue;
      }

      const baseQuery = (item.placeQuery ?? item.name).trim();
      if (!baseQuery) continue;

      const key = `${day.dayNumber}:${baseQuery.toLowerCase()}`;
      if (seen.has(key)) continue;

      seen.add(key);
      daysWithCandidates.add(day.dayNumber);
      candidates.push({
        id: item.id,
        dayNumber: day.dayNumber,
        name: item.name,
        category: item.category,
        timeLabel: item.timeLabel,
        address: baseQuery,
        query: [baseQuery, day.baseRegion, trip.trip.destination].filter(Boolean).join(", ")
      });
    }
  }

  for (const day of trip.days) {
    if (daysWithCandidates.has(day.dayNumber)) {
      continue;
    }

    const stay = matchingStayForDate(day.date, trip.stays);
    const baseQuery = (stay?.address ?? stay?.name ?? day.baseRegion).trim();
    const key = `${day.dayNumber}:${baseQuery.toLowerCase()}`;

    if (!baseQuery || seen.has(key)) continue;

    seen.add(key);
    candidates.push({
      id: `stay-${day.dayNumber}`,
      dayNumber: day.dayNumber,
      name: stay?.name ?? `Stay in ${day.baseRegion}`,
      category: stay ? "stay_checkin" : "note",
      timeLabel: null,
      address: stay?.address ?? day.baseRegion,
      query: [baseQuery, day.baseRegion, trip.trip.destination].filter(Boolean).join(", ")
    });
  }

  return candidates;
}

export function hydrateMapPlace(candidate: GeocodeCandidate, lat: number, lng: number, address: string): MapPlace {
  return {
    id: candidate.id,
    dayNumber: candidate.dayNumber,
    name: candidate.name,
    category: candidate.category,
    timeLabel: candidate.timeLabel,
    lat,
    lng,
    address,
    image: ""
  };
}