import type { TripPayload } from "@/lib/types";
import tripData from "@/data/bali-trip.json";

export const sampleTrip = tripData as TripPayload;

export type MapPlace = {
  id: string;
  dayNumber: number;
  name: string;
  category: string;
  timeLabel: string | null;
  lat: number;
  lng: number;
  address: string;
  image: string;
};

export const sampleMapPlaces: MapPlace[] = [
  {
    id: "d1-airport",
    dayNumber: 1,
    name: "Ngurah Rai International Airport",
    category: "flight_arrival",
    timeLabel: "10:20 AM",
    lat: -8.74817,
    lng: 115.16717,
    address: "DPS Airport, Bali",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "d1-hotel",
    dayNumber: 1,
    name: "Chili Ubud Cottage",
    category: "stay_checkin",
    timeLabel: "1:30 PM",
    lat: -8.5218,
    lng: 115.2639,
    address: "Jalan Nyuh Bojog, Desa Nyuh Kuning, Ubud 80571",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "d1-monkey-forest",
    dayNumber: 1,
    name: "Sacred Monkey Forest Sanctuary",
    category: "sight",
    timeLabel: "3:30 PM",
    lat: -8.5195,
    lng: 115.2582,
    address: "Jl. Monkey Forest, Ubud",
    image: "https://images.unsplash.com/photo-1545579133-99bb5ab189bd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "d2-palace",
    dayNumber: 2,
    name: "Ubud Royal Palace",
    category: "sight",
    timeLabel: "1:30 PM",
    lat: -8.5061,
    lng: 115.2625,
    address: "Puri Saren Agung, Ubud",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "d7-kelingking",
    dayNumber: 7,
    name: "Kelingking Beach Viewpoint",
    category: "sight",
    timeLabel: "7:30 AM",
    lat: -8.7564,
    lng: 115.4737,
    address: "Nusa Penida, Bali",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "d8-uluwatu-temple",
    dayNumber: 8,
    name: "Uluwatu Temple",
    category: "sight",
    timeLabel: "4:30 PM",
    lat: -8.8291,
    lng: 115.0849,
    address: "Pura Luhur Uluwatu",
    image: "https://images.unsplash.com/photo-1587135941948-670b381f08ce?auto=format&fit=crop&w=1200&q=80"
  }
];
