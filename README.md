# Itinerary Visualizer

Turn travel itineraries in PDF or DOCX into an interactive, map-based trip planner with routes, distances, place images, and context-aware recommendations.

## What this app does

- Upload itinerary files in **PDF** or **DOCX**
- Extract flights, stays, day plans, places to visit, food spots, and shopping stops
- Plot itinerary items on a **live map**
- Show **distance** and **travel time** between stops
- Add place images, ratings, and metadata
- Generate **smart recommendations** based on route fit, family context, and available time gaps

## Core flow

```text
Upload -> Parse -> Normalize -> Geocode -> Route -> Recommend -> Visualize
```

## Tech stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Mapbox GL JS

### Backend
- Next.js route handlers
- OpenAI for itinerary extraction
- Mapbox for geocoding and routing
- Google Places or similar for enrichment and photos

### Data
- PostgreSQL
- Prisma ORM

## Project structure

```text
trip-visualizer/
├── app/                    # Next.js app router pages and route handlers
├── components/             # UI components
├── data/                   # Sample data / seed-like JSON
├── lib/                    # Shared app utilities, prompts, types
├── prisma/                 # Prisma schema
├── public/                 # Static assets
├── .env.example            # Required environment variables
├── package.json
└── README.md
```

## Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
MAPBOX_ACCESS_TOKEN=your_mapbox_secret_token
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supported inputs

- `.pdf`
- `.docx`

## Extraction model

The extraction layer should normalize uploaded itineraries into structured JSON with day-wise ordered items.

Example shape:

```json
{
  "day": 1,
  "time": "15:30",
  "name": "Sacred Monkey Forest Sanctuary",
  "type": "sight",
  "distanceKm": 0.45,
  "kidFriendly": true
}
```

## Mapping features

- Live Mapbox map
- Day-based route selection
- Route lines between itinerary stops
- Distance and duration badges
- Focused place details panel

## Recommendation logic

Recommendations should be ranked using:

- proximity to current route
- detour time
- rating quality
- opening hours
- child friendliness
- category match
- time-gap fit

Example recommendation:

> This beach stop fits naturally between Uluwatu Temple and dinner, adds minimal detour, and is family-friendly.

## Suggested API surface

### Extract itinerary

```text
POST /api/extract
```

Input:
- uploaded PDF or DOCX

Output:
- normalized itinerary JSON

### Get recommendations

```text
POST /api/recommend
```

Input:
- trip day or itinerary items

Output:
- ranked recommendations

### Future endpoints

- `POST /api/geocode`
- `POST /api/route`
- `GET /api/trips/:id`
- `PATCH /api/items/:id`

## Database model

Key entities:

- Trip
- Traveler
- Stay
- Flight
- TripDay
- ItineraryItem
- RouteLeg
- Recommendation
- BudgetLine
- PracticalNote

See `prisma/schema.prisma` for the working schema.

## Deployment

### GitHub

Initialize or connect your repository:

```bash
git init
git add .
git commit -m "Initial commit"
```

Push to GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/trip-visualizer.git
git branch -M main
git push -u origin main
```

### Hosting

Recommended free-hosting path:

- **Vercel** -> `your-app.vercel.app`
- **Cloudflare Pages** -> `your-app.pages.dev`

A fully free custom apex domain is usually not the best foundation for a real project. Start with the free platform subdomain, then add a paid custom domain later if needed.

## Roadmap

### MVP
- [x] Upload UI
- [x] DOCX/PDF positioning in product copy
- [x] Mapbox integration pattern
- [x] Sample trip rendering
- [x] Extraction prompt scaffold
- [x] Prisma schema scaffold

### Next
- [ ] Real DOCX parser
- [ ] Real PDF parser
- [ ] Persist trips to database
- [ ] Geocoding pipeline
- [ ] Route generation endpoint
- [ ] Recommendation API with live providers
- [ ] User trip editing flow

## Notes

This project is meant to evolve from a static itinerary viewer into a full travel companion:

- understands trip documents
- visualizes routes
- improves travel flow
- recommends nearby options in context

## License

MIT
