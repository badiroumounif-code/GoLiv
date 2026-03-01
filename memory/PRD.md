# PLB Logistique - Product Requirements Document

## Original Problem Statement
Build a fully functional, interactive logistics website for PLB Logistique, operating in Benin (Cotonou, Porto-Novo, Calavi). Multi-phase development including public forms, admin dashboard, multi-user authentication, and advanced pricing/tracking system.

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
- Automatic tracking number generation: `PLB-YYYY-XXXXXX`
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

### P1 - Next Priority
- [ ] Configure Resend for production emails (domain verification needed)
- [ ] Real-time notifications (WebSocket)
- [ ] Proof of delivery (photo upload)

### P2 - Future
- [ ] GPS tracking integration
- [ ] Mobile app
- [ ] Payment integration (Mobile Money)
- [ ] SMS notifications

---

## Testing

- Backend: 100% (19/19 tests passed)
- Frontend: 100%
- Test files: `/app/backend/tests/test_tracking_zones_financial.py`
