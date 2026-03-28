export type SourceType = "docx";

export type AllowedCategory =
  | "flight_arrival"
  | "flight_departure"
  | "transfer"
  | "stay_checkin"
  | "stay_checkout"
  | "sight"
  | "food"
  | "shop"
  | "activity"
  | "transport"
  | "recommendation_hint"
  | "note";

export interface TripDocumentSource {
  fileName: string;
  sourceType: SourceType;
  documentTitle: string;
  rawRouteText?: string;
}

export interface TripTraveler {
  id: string;
  displayName: string;
  type: "adult" | "child";
  age?: number;
}

export interface TripRegion {
  name: string;
  nights: number;
  sequence: number;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  direction: "onward" | "return";
  from: { airportCode: string; airportName: string };
  to: { airportCode: string; airportName: string };
  departureLocal: string;
  arrivalLocal: string;
  pnr?: string;
  ticketNumber?: string;
  bookingReference?: string;
  status: string;
}

export interface Stay {
  id: string;
  sequence: number;
  name: string;
  region: string;
  address?: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  bookingSource?: string;
  bookingId?: string;
  roomType?: string;
  breakfastIncluded?: boolean;
  status?: string;
}

export interface ItineraryItem {
  id: string;
  sequence: number;
  timeLabel: string | null;
  normalizedTime: string | null;
  category: AllowedCategory;
  name: string;
  placeQuery: string | null;
  distanceText: string | null;
  distanceKm: number | null;
  durationMin: number | null;
  costText: string | null;
  kidFriendly: boolean | null;
  priority: "anchor" | "highlight" | "normal";
  confidence: number;
  notes: string[];
  warnings: string[];
  tags: string[];
  sourceText?: string;
}

export interface TripDay {
  dayNumber: number;
  date: string;
  title: string;
  baseRegion: string;
  items: ItineraryItem[];
}

export interface TripPayload {
  schemaVersion: string;
  source: TripDocumentSource;
  trip: {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    travelers: {
      adults: number;
      children: number;
      summary: string;
    };
    routeRegions: TripRegion[];
  };
  travelers: TripTraveler[];
  flights: Flight[];
  stays: Stay[];
  days: TripDay[];
  budget: {
    currency: string;
    confirmedSpend: number;
    estimatedAdditionalLow: number;
    estimatedAdditionalHigh: number;
    grandTotalLow: number;
    grandTotalHigh: number;
  };
  practicalNotes: {
    visa: string[];
    health: string[];
    packing: string[];
    warnings: string[];
  };
  enrichment: {
    status: "pending" | "complete";
    providers: {
      geocoding: string;
      photos: string;
      routing: string;
    };
  };
}

export interface MapPlace {
  id: string;
  dayNumber: number;
  name: string;
  category: string;
  timeLabel: string | null;
  lat: number;
  lng: number;
  address: string;
  image: string;
}
