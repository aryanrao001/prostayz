# GoROAM - Product Requirements

## Vision
A premium travel booking mobile app — Airbnb-inspired clone with a unique twist: curated "Book My Trip" holiday packages alongside property stays, powered by an AI concierge.

## Core Features (Shipped)
1. **Splash** - GoROAM branded intro screen
2. **Explore** - Stays ⇄ Book My Trip toggle, category chips, editor's picks carousel, featured packages, sage/cream theme
3. **Stays** - 8 seeded listings with gallery, amenities, reviews, mock Reserve booking
4. **Holiday Packages** - 6 curated trips with day-by-day itinerary, inclusions/exclusions, mock Book trip
5. **Authentication** - JWT email/password (register, login, logout) via Bearer tokens
6. **Wishlist** - save favourite stays & packages
7. **Trips** - list of user bookings (stays + packages)
8. **Profile** - avatar card + 7 fully navigable sub-pages (Personal info, Payments, Notifications, Privacy, Help, Terms, About)
9. **AI Concierge "Roamie"** - Floating FAB bottom-right → modal with Gemini 2.5 Flash recommending catalog items via tappable [stay-x]/[pkg-x] chips
10. **Smart Search** - Keyword search across stays & packages with trending destination suggestions

## Tech Stack
- Frontend: React Native Expo (Expo Router), AsyncStorage, Ionicons
- Backend: FastAPI + Motor (async MongoDB) + bcrypt + PyJWT
- AI: Gemini 2.5 Flash via emergentintegrations (EMERGENT_LLM_KEY)
- Database: MongoDB (users, stays, packages, bookings, wishlist, reviews)

## Design
- **Theme**: Sage & Cream — primary #6F8F52 (sage green), accent #FBE8CE (beige), bg #FBF8EE (cream)
- **Type**: System heading + body, generous spacing, 8pt grid
- **Navigation**: Bottom tabs (Explore · Wishlist · Trips · Profile) + floating Ask Roamie FAB

## Business Enhancement
- AI concierge drives discovery & converts long-tail intent ("under 25k, 3 days, mountains") into bookable items
- "Book My Trip" packages lift AOV vs single-night stays
- Editorial package cards + day-by-day itinerary emotionally commit the traveler
- Wishlist captures intent; Trips tab creates repeat-visit loop
