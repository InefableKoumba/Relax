# RELAX • Local Event Discovery Platform

A modern, light, framework-free web application built strictly with **raw HTML5, Vanilla JavaScript (ES6+), and Vanilla CSS3** to discover local events, search & filter listings in real time, view full event details, save favorites to a dedicated wishlist screen, reserve tickets with instant confirmation, export calendar `.ics` files, and track attendees for organizers.

---

## 🚀 Features & Implementation

### 1. Event Search & Real-Time Filtering
- **Keyword Search**: Debounced instant search across event titles, descriptions, categories, and venues.
- **Category Filter**: Multi-select category pills with dynamic event count indicators.
- **Date Range Picker**: Filter events between custom `From` and `To` dates.
- **Location Filter**: Filter by venue name, city, or neighborhood.
- **Price Range Slider**: Interactive range slider from `$0` (Free) to `$250+`.
- **Sorting Engine**: Sort by Upcoming Date, Price (Low to High / High to Low), Fewest Spots Left, or Alphabetical (A-Z).
- **Reset All**: Single-click reset to restore default catalog state.

### 2. Interactive Event Catalog (Wireframe 1)
- Crisp 3x3 desktop grid and adaptive mobile layout matching Wireframe 1.
- Event cards with high-definition Unsplash photography, category badges, pricing pills, date/time, venue tags, and "VIEW DETAILS" button.
- One-click heart bookmark button with instant toast notification and global counter synchronization.
- Client-side pagination with page indicators and previous/next buttons.

### 3. Dedicated Favorites Screen (Wireframe 2)
- Standalone view accessible via header and mobile bottom navigation.
- Top bar with back navigation, total saved count subtitle, and profile avatar.
- Filter tabs: **`ALL (X)`** vs **`THIS MONTH (Y)`**.
- Single-click **"Clear All"** option.
- Wishlist cards matching Wireframe 2: Square thumbnail, title, date/time, price, venue tag pill, **`[🗑 Remove]`** outline button, and **`[BOOK NOW >]`** primary button.
- Dashed **`EXPLORE MORE EVENTS`** card with `+` icon linking back to the catalog.

### 4. Event Detail View (`event-details.html`)
- Full event descriptions and category tags.
- Stylized interactive SVG venue map with animated radar pulse pin.
- Sticky ticket reservation widget with remaining spots progress bar.
- Organizer profile card with verified community partner badge.
- Native `.ics` iCalendar file generator for Apple Calendar, Google Calendar, and Outlook.
- Social sharing with Web Share API and automatic clipboard fallback.

### 5. Ticket Reservation & RSVP
- Modal dialog with ticket counter stepper (1 to 6 spots).
- Dynamic price calculation (supports paid and free tickets).
- Automatic spot deduction from available capacity in `localStorage`.
- Realistic printable ticket confirmation pass with SVG barcode, tear notches, and unique confirmation reference code (e.g. `BK-XXXX-XXXX`).

### 6. User Account Session Switcher
- Switch seamlessly between **Attendee** (`Alex Morgan`) and **Organiser** (`Taylor Reed`).
- Profile modal displays saved favorites count, active reservation references, and quick role switching.

### 7. Organizer Attendee Tracker (`organizer.html`)
- Key business metrics: Live Published Events, Total Registered Attendees, Confirmed Gross Volume.
- Attendee Tracker table with real-time registrations, attendee names, emails, ticket counts, and timestamps.
- **Create New Event Form**: Allows organizers to publish new events with all 8 mandatory schema attributes directly into `localStorage`.

---

## 📁 File Structure

```
├── index.html                  # Main Catalog / Search / Filters (Wireframe 1)
├── favorites.html              # Dedicated Favorites Screen (Wireframe 2)
├── event-details.html          # Full Detail View, SVG Map, .ics Export, RSVP
├── organizer.html              # Organizer Portal & Real-Time Attendee Tracker
├── styles/
│   ├── main.css                # Design tokens, typography, header, mobile bottom nav
│   ├── components.css          # Cards, filters, modal dialogs, ticket pass, badges
│   └── responsive.css          # Media queries for 1280px desktop, tablet, and mobile
├── scripts/
│   ├── storage.js              # LocalStorage manager, reactive state dispatcher
│   ├── eventService.js         # Event data loader, search & filter engine, booking logic
│   ├── favorites.js            # Bookmark manager, month filter, badge listeners
│   ├── ui.js                   # DOM renderers, toast alerts, modals, .ics exporter
│   └── app.js                  # App router and coordinator
├── data/
│   └── mock-events.json        # Seed dataset with 12 rich events (8 schema attributes)
└── assets/
    └── favicon.svg             # Deep blue calendar ticket with orange accent star
```

---

## 💻 Running Locally

No bundlers, Node frameworks, or build steps required. Simply serve the files using any static server:

```bash
# Using Python
python3 -m http.server 8080

# Or using npx
npx serve .
```

Open `http://localhost:8080` in your browser.
