# Paradeta Income Management — Full Spec

## Overview

Add a new **Ingressos Paradeta** tab to the gelatari app for tracking daily gross income at the summer shop (paradeta). This is independent from the ice cream stock/cost systems — just pure income tracking.

## Data Model

### Daily Income Record (`DailyParadetaIncome`)

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `date` | Date | The work day (date only, no time) — **unique index** |
| `cardAmount` | Number | Total card/gross card revenue for the day (€) |
| `endCash` | Number | Cash counted in register at day end (€) |
| `cashRetired` | Number | Cash removed from register during the day (€) |
| `notes` | String? | Optional free-text notes |
| `createdAt` | Date | Auto (Mongoose timestamps) |
| `updatedAt` | Date | Auto (Mongoose timestamps) |

### Computed (not stored):

- **`startCash`** = previous day's `endCash - cashRetired` (or 0 if no previous day, or first-day float)
- **`cashIncome`** = `endCash - startCash`
- **`totalIncome`** = `cardAmount + cashIncome`

### Season Start

To handle the first day of the season, we need a **"initial float"** concept. The user can set a starting cash amount for the first entry. Proposal:
- On the very first created entry (earliest date), if there's no previous day, the user enters a **"cash float at day start"** field (shown only when no previous day exists). After that, `startCash` is always derived from the previous day.
- Alternatively, we could have a separate settings field "Initial cash float (€)". Simpler: show a `startCash` override field in the edit modal when there's no preceding day.

### Data Flow Example

```
Day 1 (season start):
  User enters: startCash=200, endCash=600, cashRetired=500, cardAmount=1500
  Computed: cashIncome=400, totalIncome=1900
  Next day's startCash = 600-500 = 100

Day 2:
  User enters: endCash=300, cashRetired=50, cardAmount=1200
  Computed: startCash=100 (from day 1), cashIncome=200, totalIncome=1400
  Next day's startCash = 300-50 = 250
```

## UI: Tab Setup

- Tab type: `'paradetaIncome'`
- Tab title: `'Ingressos Paradeta'`
- Added via a new floating action button: `📊 Ingressos Paradeta`
- App state persisted in localStorage like other tabs
- Two sub-views within the tab: **Calendar** and **Analytics**

## UI: Calendar View (Primary — Daily Entry)

### Layout

- **Top bar**: Month navigation (◀ Month Year ▶) with a "Today" button
- **Summary row** below month nav: Total card, total cash income, total gross income for the displayed month
- **Calendar grid**: Standard month grid (7 columns, rows per week)
  - Each day is a card/box showing:
    - Day number
    - If data exists: total income (color-coded), small card/cash icons
    - If no data: empty/grey (clickable to add)
  - **Color coding by income bracket** (configurable thresholds):
    - €0: grey
    - €0.01–€500: light green
    - €500–€1000: medium green
    - €1000–€1500: yellow
    - €1500–€2000: orange
    - €2000+: red/dark
  - Month collapses if no data at all, with an expand button ("Afegir dades per [mes]")

### Mobile

- No calendar grid on mobile
- Instead, show a scrollable list of **daily cards** for the selected month, each showing date, totals, and a quick edit button

### Adding/Editing a Day (Modal)

Click a day → modal with:

| Field | Behavior |
|---|---|
| **Date** | Date input, pre-filled per the smart default rule (see below) |
| **Start cash (read only)** | Derived from previous day. Shown for verification. Editable only for first-day or when no previous day. |
| **Card income 💳** | Number input, step 0.01, placeholder "0.00" |
| **End cash 💵** | Number input, step 0.01, placeholder "0.00" |
| **Cash retired 💵** | Number input, step 0.01, placeholder "0.00" |
| **Notes 📝** | Optional textarea |
| **Computed income (read only)** | Shown: Cash Income, Total Gross Income |
| **Delete button** | Only if entry exists (with confirmation) |
| **Save / Cancel** | Buttons |

### Smart Date Default

- If current time is **before 10:00**, default to **yesterday's date**
- If current time is **after 10:00**, default to **today's date**
- Always allows user to change the date freely

### Speed of Use

- "Add new" flow: select day → modal appears → tab through fields → save → back to calendar
- For editing from the floating action buttons, a quick-add might be useful later, but the modal approach is sufficient for MVP
- The user can navigate to any month and fill in past days without restrictions

## UI: Analytics View

### Navigation

- A tab bar / toggle at the top: **Calendar** | **Analytics**

### Analytics Sections (scrollable page)

1. **Summary cards** (top row):
   - Total all-time income
   - Total card income
   - Total cash income
   - Number of days with income
   - Average daily income

2. **Monthly bar chart**: Total income per month for selected year range
   - Bars split by card vs cash (stacked or grouped)
   - Month labels on X axis

3. **Weekly bar chart**: Total income per week
   - Grouped by ISO week
   - Year picker to filter

4. **Card vs Cash pie chart**: Overall breakdown

5. **Daily trend line chart**: Income per day over a selected month/range
   - Line for total income
   - Optional: separate lines for card and cash

6. **Weekday heatmap** or bar chart: Average income by day of week

7. **Cumulative income**: Running total line over the season

8. **Year-over-year comparison** (if data from multiple years exists):
   - Monthly overlay chart comparing same months across years

9. **Export button**: Download visible data as CSV

### Date Range Filters (for analytics)

- Year selector (default: all years)
- Month selector (optional, to zoom in)
- Quick presets: "This season", "Last season", "All time"

## Backend

### New Model
- `/backend/src/models/DailyParadetaIncome.ts` — Mongoose model per data model above

### New Routes (protected, mounted at `/api/paradeta-income`)
- `GET /api/paradeta-income` — List entries, supports query params:
  - `fromDate`, `toDate` (ISO date strings)
  - `limit`, `offset` (pagination)
  - `year`, `month` (for monthly view)
  - Returns sorted by date ascending
- `GET /api/paradeta-income/:id` — Single entry
- `POST /api/paradeta-income/` — Create entry
  - Body: `{ date, cardAmount, endCash, cashRetired, notes?, startCash? }`
  - If `startCash` is provided and there's no previous entry, use it; otherwise derive from previous day
  - Validates no duplicate date
- `PUT /api/paradeta-income/:id` — Update entry
  - Same fields, partial updates allowed
- `DELETE /api/paradeta-income/:id` — Delete entry
  - Requires confirmation (handled on frontend)
- `GET /api/paradeta-income/stats` — Aggregated statistics for analytics:
  - Query params: `fromDate`, `toDate`, `groupBy` (month | week | year)
  - Returns aggregated totals per group
- `GET /api/paradeta-income/export` — Export data as JSON (CSV on frontend or backend)

### New Service
- `/backend/src/services/paradetaIncomeService.ts` — Business logic for computations:
  - Deriving `startCash` from previous day
  - Computing stats/aggregations
  - Validation

### New Controller
- `/backend/src/controllers/paradetaIncomeController.ts`

### Server Setup
- Add routes in `server.ts`: `app.use('/api/paradeta-income', paradetaIncomeRoutes);`

## Frontend

### New API Module
- `/frontend/src/api/paradetaIncome.ts` — All API calls matching backend routes

### New Types
- `/frontend/src/types/paradetaIncome.ts` — DailyIncomeRecord, stats types, etc.

### New Tab Type
- Extend `TabData` union in `types/tabs.ts` with `ParadetaIncomeTabData`

### Components

| Component | File |
|---|---|
| `ParadetaIncomeTab` (main container) | `src/components/paradetaIncome/ParadetaIncomeTab.tsx` |
| `CalendarView` | `src/components/paradetaIncome/CalendarView.tsx` |
| `DayEditModal` | `src/components/paradetaIncome/DayEditModal.tsx` |
| `DayCard` (calendar cell) | `src/components/paradetaIncome/DayCard.tsx` |
| `AnalyticsView` | `src/components/paradetaIncome/AnalyticsView.tsx` |
| Charts (lightweight, no heavy lib) | `src/components/paradetaIncome/charts/` (SVG-based or canvas) |

### App Integration

- Add the tab type switch in `App.tsx` (similar to CostosTab/IceCreamDashboardTab)
- Add handler `handleOpenParadetaIncomeTab` and a new floating button `📊 Ingressos Paradeta`
- Add the tab config in `TabContent.tsx` routing
- Add state restore for this tab type in `App.tsx` `loadAppState`
- Extend `FloatingActionButtonsGroup` props with `onOpenParadetaIncomeTab`

### Color Coding (Calendar)

```ts
const DEFAULT_INCOME_BRACKETS = [
  { max: 0, color: '#e8f0e8', label: 'Sense dades' },        // very light grey-green
  { max: 200, color: '#e8f5e9', label: 'Dia caca (<200)' },   // very light green
  { max: 400, color: '#c8e6c9', label: 'Dia meh (<400)' },    // light green
  { max: 600, color: '#a5d6a7', label: 'Dia ok (<600)' },     // medium-light green
  { max: 800, color: '#66bb6a', label: 'Dia guai (<800)' },   // medium green
  { max: 1000, color: '#43a047', label: 'Dia top (<1000)' },  // strong green
  { max: Infinity, color: '#2e7d32', label: 'Dia max (>1000)' }, // dark green
];
```

### Configurability

User can customize brackets via a settings ⚙️ panel in the tab:
- Add/remove brackets
- Edit thresholds and labels
- Choose color (green tones or custom)
- Settings persist in localStorage

## Future Considerations (out of scope for MVP)

- Photo receipts attached to a day
- Multiple paradetas (locations)
- Expense tracking (separate from cash retired)
- Shift management
- Real-time sync / offline mode
