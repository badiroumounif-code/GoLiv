# GoLiv Logistique - Changelog

## December 2025

### Phase 9.1 - CSV Export Bug Fix ✅
- Fixed 500 errors on CSV exports (delivery-requests, riders, merchants)
- Root cause: `csv.DictWriter` using `items[0].keys()` failed with varying document schemas
- Solution: Explicit header lists with `extrasaction='ignore'`
- All 4 CSV exports now return 200 with proper headers

### Phase 9 - Google OAuth Integration ✅
- **Sign in with Google** button on login page using Emergent-managed Google Auth
- Backend endpoint `/api/auth/google/session` to exchange session_id for JWT
- New users created via Google OAuth are assigned `merchant` role by default
- Stores `auth_provider: "google"` and user's Google profile picture
- AuthCallback component handles OAuth redirect flow
- Compatible with existing JWT-based auth system

### Phase 8 - In-App Notifications ✅
- NotificationBell component with badge count
- Real-time notification polling (15s interval)
- Notification types: delivery assigned, status changed, new delivery request
- Mark all as read functionality
- Per-user notification filtering

### Phase 7 - UI/Layout Improvements ✅
- CRITICAL FIX: `App.css` was never imported into `App.js`
- New utility class hierarchy for typography
- Container padding improved for mobile
- Hero typography upgraded across all pages
- Navbar overflow fix: CTA hidden below `2xl` (1536px)

### Phase 6 - PLB → GoLiv Rebrand ✅
- Renamed all references "PLB Logistique" → "GoLiv Logistique"
- New tracking format: `GOLIV-YYYY-XXXXXX`
- Updated email templates, API title, page labels

### Phase 5 - FAQ Redesign ✅
- New FAQ page at `/faq`
- Categories: Suivi de Colis, Tarification, Livraison, Poids et Colis, Contact et Support
- Search functionality, accordion-style questions

### Phase 4 - Tracking & Pricing System ✅
- Automatic tracking number generation
- Zone-based pricing with admin configuration
- Weight surcharge system
- Financial dashboard with commission tracking

### Phase 3 - Multi-User Authentication ✅
- JWT-based authentication
- Three roles: Admin, Rider, Merchant
- Dedicated dashboards for each role

### Phase 2 - Admin Dashboard ✅
- Statistics and analytics with charts
- Data management for deliveries, merchants, riders
- CSV export functionality

### Phase 1 - Core Website ✅
- Public pages: Home, How it Works, Services & Pricing, About, Contact, FAQ
- Forms: Delivery Request, Feedback, Partner Applications
- Email notifications via Resend
