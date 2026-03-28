import { NextRequest, NextResponse } from "next/server";
import { sampleTrip } from "@/lib/sample-trip";

type Candidate = {
  name: string;
  category: "food" | "shop" | "sight" | "activity";
  area: string;
  rating: number;
  detourMinutes: number;
  childFriendly: boolean;
  openNowLikely: boolean;
  note: string;
};

const candidates: Candidate[] = [
  {
    name: "Tutmak Cafe",
    category: "food",
    area: "Ubud",
    rating: 4.4,
    detourMinutes: 3,
    childFriendly: true,
    openNowLikely: true,
    note: "Low-detour palace-area cafe before the evening performance."
  },
  {
    name: "Padang Padang Beach",
    category: "sight",
    area: "Uluwatu",
    rating: 4.6,
    detourMinutes: 8,
    childFriendly: true,
    openNowLikely: true,
    note: "Fits naturally into the Uluwatu cliff and dinner zone."
  },
  {
    name: "Cafe La Pasion",
    category: "food",
    area: "Uluwatu",
    rating: 4.5,
    detourMinutes: 4,
    childFriendly: true,
    openNowLikely: true,
    note: "Breakfast-friendly near the hotel where breakfast is not included."
  }
];

function scoreCandidate(candidate: Candidate, area: string, tripHasChild: boolean): number {
  let score = 0;
  if (candidate.area === area) score += 3;
  score += candidate.rating;
  score += Math.max(0, 3 - candidate.detourMinutes / 10);
  if (tripHasChild && candidate.childFriendly) score += 2;
  if (candidate.openNowLikely) score += 1;
  return Number(score.toFixed(2));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const dayNumber = Number(body.dayNumber ?? 8);
  const day = sampleTrip.days.find((item) => item.dayNumber === dayNumber) ?? sampleTrip.days[0];
  const area = day.baseRegion;
  const tripHasChild = sampleTrip.travelers.some((traveler) => traveler.type === "child");

  const scored = candidates
    .filter((candidate) => candidate.area === area)
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, area, tripHasChild),
      reason:
        area === "Uluwatu"
          ? "Boosted because Uluwatu mornings need breakfast options and low-detour family stops."
          : "Boosted because it fits the active day route with minimal backtracking."
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ dayNumber, area, recommendations: scored });
}
