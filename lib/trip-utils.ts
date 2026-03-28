import type { ItineraryItem, Stay, TripDay, TripPayload } from "@/lib/types";

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function inferBaseRegion(date: string, stays: Stay[]): string {
  const matchingStay = stays.find((stay) => date >= stay.checkInDate && date < stay.checkOutDate);
  return matchingStay?.region ?? stays[stays.length - 1]?.region ?? "Unknown";
}

function buildPlaceholderItem(dayNumber: number, region: string): ItineraryItem {
  return {
    id: `generated_day_${dayNumber}`,
    sequence: 1,
    timeLabel: null,
    normalizedTime: null,
    category: "note",
    name: `Open planning day in ${region}`,
    placeQuery: region,
    distanceText: null,
    distanceKm: null,
    durationMin: null,
    costText: null,
    kidFriendly: null,
    priority: "normal",
    confidence: 0.35,
    notes: ["This day was not fully detailed in the source data, so it is shown as a placeholder."],
    warnings: [],
    tags: ["generated", "placeholder"]
  };
}

function buildNormalizedDay(
  trip: TripPayload,
  existingDay: TripDay | undefined,
  dayNumber: number,
  date: string
): TripDay {
  const baseRegion = existingDay?.baseRegion ?? inferBaseRegion(date, trip.stays);

  if (existingDay) {
    return {
      ...existingDay,
      dayNumber,
      date,
      baseRegion,
      items: existingDay.items.length > 0 ? existingDay.items : [buildPlaceholderItem(dayNumber, baseRegion)]
    };
  }

  return {
    dayNumber,
    date,
    title: `Day ${dayNumber} in ${baseRegion}`,
    baseRegion,
    items: [buildPlaceholderItem(dayNumber, baseRegion)]
  };
}

export function normalizeTripPayload(trip: TripPayload): TripPayload {
  const sortedDays = [...trip.days].sort((left, right) => left.dayNumber - right.dayNumber);
  const startDate = trip.trip.startDate ? new Date(`${trip.trip.startDate}T00:00:00Z`) : new Date();
  const totalDays = Math.max(
    trip.trip.durationDays || 0,
    sortedDays.length,
    trip.trip.startDate && trip.trip.endDate
      ? Math.round((new Date(`${trip.trip.endDate}T00:00:00Z`).getTime() - startDate.getTime()) / 86400000) + 1
      : 0
  );
  const dayByNumber = new Map(sortedDays.map((day) => [day.dayNumber, day]));

  const normalizedDays = Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const date = formatDate(addDays(startDate, index));
    return buildNormalizedDay(trip, dayByNumber.get(dayNumber), dayNumber, date);
  });

  return {
    ...trip,
    days: normalizedDays
  };
}

function tryParseTripPayload(candidate: string): TripPayload | null {
  try {
    const parsed = JSON.parse(candidate) as Partial<TripPayload>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.trip || !Array.isArray(parsed.days)) return null;
    return normalizeTripPayload(parsed as TripPayload);
  } catch {
    return null;
  }
}

export function parseTripPayload(rawText: string): TripPayload | null {
  const direct = tryParseTripPayload(rawText);
  if (direct) return direct;

  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fenced = tryParseTripPayload(fencedMatch[1]);
    if (fenced) return fenced;
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return tryParseTripPayload(rawText.slice(firstBrace, lastBrace + 1));
  }

  return null;
}