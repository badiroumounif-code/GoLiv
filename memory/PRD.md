# GoLiv Logistique - Product Requirements Document

## Original Problem Statement
Build a fully functional, interactive logistics website for GoLiv Logistique, operating in Benin (Cotonou, Porto-Novo, Calavi). Multi-phase development including public forms, admin dashboard, multi-user authentication, and advanced pricing/tracking system.

## User Personas
1. **Clients** - Need to request deliveries and track packages
2. **Merchants** - Business partners managing regular deliveries
3. **Riders** - Delivery personnel managing assigned tasks
4. **Admin** - Platform managers overseeing operations and finances

---

## What's Been Implemented

### Phase 1 - Core Website ✅
- Public pages: Home, How it Works, Services & Pricing, About, Contact, FAQ
- Forms: Delivery Request, Feedback, Partner Applications
- Email notifications via Resend

### Phase 2 - Admin Dashboard ✅
- Statistics and analytics with charts
- Data management for deliveries, merchants, riders
- CSV export functionality
- Status management and assignment

### Phase 3 - Multi-User Authentication ✅
- JWT-based authentication
- Three roles: Admin, Rider, Merchant
- Dedicated dashboards for each role
- Login/Register system

### Phase 4 - Tracking & Pricing System ✅ (December 2025)

**Tracking System:**
- Automatic tracking number generation: `GOLIV-YYYY-XXXXXX`
- Public tracking on homepage (no separate page needed)
- Real-time status updates
- Tracking number sent via email

**Zone-Based Pricing:**
- Configurable zones with base prices and rider payments
- Default zones: Cotonou Centre (1,500 FCFA), Akpakpa (2,000 FCFA), Calavi/Godomey (2,500 FCFA), Périphérie (3,000 FCFA), Porto-Novo (3,500 FCFA), Hors Zone (5,000 FCFA)
- Admin can add/edit/delete zones

**Weight Surcharge:**
- Threshold: 5 kg
- Surcharge: +500 FCFA for packages > 5kg
- Configurable in admin settings

**Commission & Margins:**
- Platform commission: 15% (configurable)
- Per-delivery tracking: Customer price, Rider payment, Platform commission
- Financial dashboard with totals and date filters

**Admin Settings Page:**
- Zones management (CRUD)
- Weight surcharge configuration
- Commission settings (percentage or fixed)

**Financial Dashboard:**
- Total revenue (Chiffre d'affaires)
- Rider payments total
- Platform commission total
- Net margin calculation
- Filter by date range
- Breakdown by status (Delivered, In Progress)

### Phase 5 - FAQ Redesign ✅
- New FAQ page at `/faq`
- Categories: Suivi de Colis, Tarification, Livraison, Poids et Colis, Contact et Support
- Search functionality
- Accordion-style questions
- Contact CTA section

### Phase 6 - PLB → GoLiv Rebrand ✅ (December 2025)
- Renamed all textual references "PLB Logistique" → "GoLiv Logistique"
- New tracking format: `GOLIV-YYYY-XXXXXX` (legacy `PLB-` numbers remain readable for backward compat)
- Updated email templates, API title, page labels, alt texts, FAQ examples
- Preserved: admin credentials (`admin@plb.bj` / `plb2024`), JWT secret, localStorage keys, deployment URL

### Phase 7 - UI/Layout Improvements ✅ (December 2025)
- **CRITICAL FIX**: `App.css` was never imported into `App.js` — all custom utility classes were dead. Now properly imported.
- New utility class hierarchy: `.heading-hero`, `.heading-section`, `.heading-card`, `.eyebrow-label`, `.body-lead`, `.feature-card`, `.section-padding`, `.section-padding-sm`, `.container-custom`
- Container padding improved for mobile: `px-5 sm:px-6 md:px-8 lg:px-10`
- Section padding standardized: `py-16 md:py-20 lg:py-24` with smaller variant for CTA bands
- Hero typography upgraded across all pages: `text-4xl sm:text-5xl lg:text-6xl` with tight tracking
- Eyebrow labels: uppercase, sky-500, tracked spacing for stronger visual hierarchy
- Card hover lift: `-translate-y-1` on hover with shadow transition
- Navbar: `whitespace-nowrap` + `shrink-0` to prevent text wrapping; CTA hidden below `2xl` to prevent overflow at 1440px
- Dashboards (Admin, Merchant, Rider): bigger H1, uppercase eyebrow tag, increased section padding `py-8 md:py-10`, gap-4 md:gap-5

### Phase 8 - In-App Notifications ✅ (December 2025)
- NotificationBell component with badge count
- Real-time notification polling (15s interval)
- Notification types: delivery assigned, status changed, new delivery request
- Mark all as read functionality
- Per-user notification filtering

### Phase 9 - Google OAuth Integration ✅ (December 2025)
- **Sign in with Google** button on login page using Emergent-managed Google Auth
- Backend endpoint `/api/auth/google/session` to exchange session_id for JWT
- New users created via Google OAuth are assigned `merchant` role by default
- Stores `auth_provider: "google"` and user's Google profile picture
- AuthCallback component handles OAuth redirect flow
- Compatible with existing JWT-based auth system

### Phase 9.1 - CSV Export Bug Fix ✅ (December 2025)
- Fixed 500 errors on CSV exports (delivery-requests, riders, merchants)
- Root cause: `csv.DictWriter` using `items[0].keys()` failed with varying document schemas
- Solution: Explicit header lists with `extrasaction='ignore'`
- All 4 CSV exports now return 200 with proper headers

---

## Technical Architecture

**Stack:**
- Frontend: React + Tailwind CSS + Shadcn UI + Framer Motion
- Backend: FastAPI (Python) + Motor (async MongoDB)
- Database: MongoDB
- Email: Resend API

**Key Files:**
- `/app/backend/server.py` - All API endpoints
- `/app/frontend/src/App.js` - React routes
- `/app/frontend/src/context/AuthContext.jsx` - Authentication
- `/app/frontend/src/pages/` - All page components

---

## API Endpoints

### Public
- `GET /api/zones` - Active zones with pricing
- `GET /api/track/{tracking_number}` - Track delivery
- `POST /api/delivery-requests` - Create delivery

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/google/session` - Exchange Google OAuth session_id for JWT

### Admin
- `GET/POST/PATCH/DELETE /api/admin/zones` - Zone management
- `GET/PUT /api/admin/settings` - Platform settings
- `GET /api/admin/financial` - Financial stats

### Rider & Merchant
- Role-specific CRUD operations

---

## Credentials

**Admin:** admin@plb.bj / plb2024

---

## Prioritized Backlog

### P0 - Completed ✅
- [x] Tracking system
- [x] Zone-based pricing
- [x] Weight surcharge
- [x] Financial dashboard
- [x] FAQ redesign
- [x] PLB → GoLiv rebrand
- [x] UI/Layout improvements (typography, spacing, mobile responsiveness)
- [x] In-app notifications (bell icon, polling, mark as read)
- [x] Google OAuth integration (Emergent-managed)
- [x] CSV export bug fix (explicit headers + extrasaction='ignore')

### P1 - Next Priority (refactoring + features)
- [ ] Refactor `server.py` (~1800 lines) into routes/auth.py, routes/deliveries.py, routes/admin.py, models.py
- [ ] Refactor `Admin.jsx` (~2350 lines) into sub-components (FinancialDashboard.jsx, ZoneManager.jsx, etc.)
- [ ] Configure Resend for production emails (domain verification needed)
- [ ] Real-time push notifications for delivery status (WebSocket or SSE)
- [ ] Proof of delivery (photo upload)

### P2 - Future
- [ ] Export charts/graphs from admin dashboard to PDF/CSV
- [ ] GPS tracking integration
- [ ] Mobile app
- [ ] Payment integration (Mobile Money)
- [ ] SMS notifications

---

## Testing

- Backend: 66+ tests passed across multiple test files (`/app/backend/tests/`)
  - `test_google_auth_and_exports.py` (11 tests) - Google Auth + CSV exports
  - `test_notifications_exports.py` (16 tests) - Notifications + finances CSV
  - `test_tracking_zones_financial.py`, `test_auth.py`
- Frontend: tested via testing_agent_v3_fork (iteration_6) — Google OAuth button + navbar overflow fix verified
- Test reports: `/app/test_reports/iteration_6.json`
