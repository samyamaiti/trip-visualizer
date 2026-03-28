export const EXTRACTION_SYSTEM_PROMPT = `You are an itinerary extraction engine.

Your job is to convert DOCX travel document text into strict JSON.

Rules:
1. Output valid JSON only.
2. Do not invent places or bookings.
3. Preserve source wording in source_text fields.
4. Normalize dates to YYYY-MM-DD when possible.
5. Normalize times to HH:MM 24-hour format when possible.
6. Extract day-wise ordered itinerary items.
7. Classify each item into one of:
   flight_arrival, flight_departure, transfer, stay_checkin, stay_checkout,
   sight, food, shop, activity, transport, recommendation_hint, note
8. Extract distance_km and duration_min when explicitly stated.
9. If a place is vague, keep the original name in place_query and set confidence lower.
10. Add warnings, kid_friendly, and tags when explicitly supported by the text.
11. Never output markdown.
12. If a field is unknown, use null.`;

export function buildExtractionUserPrompt(documentText: string): string {
  return `Extract the following travel document into the target schema.

Return JSON with these top-level keys:
source, trip, travelers, flights, stays, days, budget, practicalNotes, extractionMeta.

Requirements:
- Detect trip title, date range, destination, traveler summary, and route regions.
- Extract all flights and hotel bookings.
- Extract every itinerary day as a day object.
- Within each day, extract every activity in sequence order.
- Preserve explicit cost text and distance text.
- Normalize:
  - date => YYYY-MM-DD
  - normalizedTime => HH:MM (24-hour)
  - distanceKm => number
  - durationMin => integer
- Infer category only from the allowed enum.
- Add:
  - kidFriendly: boolean|null
  - warnings: string[]
  - tags: string[]
  - priority: anchor | highlight | normal
  - confidence: 0.0 to 1.0
- Keep sourceText for each extracted item.

Important:
- Flights and hotels are anchor objects and must also appear in the day timelines where relevant.
- Do not remove practical notes such as visa, health, boat transfer, or packing notes.
- Distinguish confirmed bookings from recommendations and optional dining suggestions.

DOCUMENT TEXT:
${documentText}`;
}
