# PLB Logistique - Product Requirements Document

## Original Problem Statement
Build a fully functional, interactive logistics website for PLB Logistique, operating in Benin (Cotonou, Porto-Novo, Calavi). The objective is creating a realistic, near-final product to observe real usage and gather insights before working with a full-time developer.

## User Personas
1. **Clients (Particuliers/Entreprises)** - Need to request deliveries across Benin
2. **Potential Merchant Partners** - Businesses looking to partner for regular deliveries
3. **Potential Rider Partners** - Individuals looking to become delivery riders
4. **Admin/Operations Team** - Need to view and manage all submissions
5. **Approved Merchants** - Logged-in merchants managing their deliveries
6. **Approved Riders** - Logged-in riders accepting and completing deliveries

## Core Requirements (Static)
- French language only
- Light/soft color palette (sky blue, light grey, white)
- Mobile-first, responsive design
- JWT-based authentication for multi-user roles
- Email notifications for new requests (Resend integration)
- CSV export capability for all data

---

## What's Been Implemented

### Phase 1 - Initial MVP (Completed)

**Pages Built:**
- ✅ Home page with hero section, features, stats, testimonials
- ✅ How it Works (Comment ça marche) - 4-step process
- ✅ Services & Pricing - Package types, urgency levels, pricing table
- ✅ About (À propos) - Company story, values, team, coverage
- ✅ Contact - Contact form + contact info

**Forms Implemented:**
- ✅ Delivery Request Form (nom, téléphone, zones, type colis, urgence, notes)
- ✅ Feedback Form (rating stars, commentaire, problèmes)
- ✅ Merchant Partner Application Form
- ✅ Rider Partner Application Form
- ✅ Contact Form

### Phase 2 - Admin Dashboard (Completed)

- ✅ Password-protected admin login
- ✅ Statistics overview with charts
- ✅ Tabbed view for all data types
- ✅ CSV export for each category
- ✅ Delivery assignment to riders
- ✅ Status management (accept/refuse merchants & riders)
- ✅ Delivery status tracking (nouveau, assigné, en_cours, livré, annulé)
- ✅ Delete functionality for merchants/riders/deliveries
- ✅ Advanced filters (date, status, zone, rider, urgency)
- ✅ Search functionality

### Phase 3 - Multi-User Authentication (Completed December 2025)

**Authentication System:**
- ✅ JWT-based authentication with role-based access
- ✅ Three user roles: Admin, Rider (Livreur), Merchant (Commerçant)
- ✅ Login page at `/connexion` with registration option
- ✅ Automatic user account creation when admin accepts applications
- ✅ Auto-generated passwords sent via email upon approval

**User Dashboards:**
- ✅ Admin Dashboard (`/admin`) - Full platform management
- ✅ Rider Dashboard (`/espace-livreur`) - View assigned deliveries, accept/refuse, update status
- ✅ Merchant Dashboard (`/espace-commercant`) - View orders, create new deliveries, export data

**Navbar Integration:**
- ✅ "Connexion" button when logged out
- ✅ User menu with role label when logged in
- ✅ "Mon espace" link to appropriate dashboard
- ✅ Logout functionality

---

## Backend API Endpoints

### Public Endpoints
- `POST /api/delivery-requests` - Create delivery request
- `POST /api/feedback` - Submit feedback
- `POST /api/merchants` - Apply as merchant partner
- `POST /api/riders` - Apply as rider partner
- `POST /api/contact` - Send contact message

### Authentication Endpoints
- `POST /api/auth/login` - User login (all roles)
- `POST /api/auth/register` - Register new user (rider/merchant only)
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/init-admin` - Initialize admin account (one-time)

### Rider Endpoints (Protected)
- `GET /api/rider/deliveries` - Get assigned deliveries
- `GET /api/rider/stats` - Get rider statistics
- `GET /api/rider/profile` - Get rider profile
- `PATCH /api/rider/deliveries/{id}/accept` - Accept delivery
- `PATCH /api/rider/deliveries/{id}/refuse` - Refuse delivery
- `PATCH /api/rider/deliveries/{id}/status` - Update delivery status

### Merchant Endpoints (Protected)
- `GET /api/merchant/deliveries` - Get merchant's orders
- `POST /api/merchant/deliveries` - Create new delivery
- `GET /api/merchant/stats` - Get merchant statistics
- `GET /api/merchant/profile` - Get merchant profile
- `GET /api/merchant/export` - Export deliveries as CSV

### Admin Endpoints (Protected)
- All `/api/admin/*` endpoints for data management

---

## Technical Architecture

**Frontend:** React + Tailwind CSS + Shadcn UI + Framer Motion
**Backend:** FastAPI (Python) with Motor (async MongoDB)
**Database:** MongoDB
**Authentication:** JWT tokens with bcrypt password hashing
**Email:** Resend API

**Key Files:**
- `/app/backend/server.py` - Main API with all endpoints
- `/app/frontend/src/App.js` - React routes
- `/app/frontend/src/context/AuthContext.jsx` - Authentication context
- `/app/frontend/src/pages/LoginPage.jsx` - Login/Register page
- `/app/frontend/src/pages/RiderDashboard.jsx` - Rider dashboard
- `/app/frontend/src/pages/MerchantDashboard.jsx` - Merchant dashboard
- `/app/frontend/src/pages/Admin.jsx` - Admin dashboard
- `/app/frontend/src/components/Navbar.jsx` - Navigation with auth

---

## Credentials

**Admin Login:**
- Email: `admin@plb.bj`
- Password: `plb2024`

**Test Flow:**
1. Apply as merchant/rider via public forms
2. Admin approves application → user account auto-created
3. User receives credentials via email
4. User logs in to access their dashboard

---

## Prioritized Backlog

### P0 - Critical
- [x] Multi-user authentication system
- [x] Rider dashboard
- [x] Merchant dashboard
- [ ] Configure Resend API key for production emails

### P1 - High Priority
- [ ] Real-time delivery tracking with GPS
- [ ] Push notifications for delivery updates
- [ ] WhatsApp integration for customer communication
- [ ] Proof of delivery (photo upload)

### P2 - Medium Priority
- [ ] Customer accounts for tracking orders
- [ ] Advanced analytics with charts
- [ ] Payment integration (Mobile Money, Stripe)
- [ ] SMS notifications (Twilio)

### P3 - Nice to Have
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Automated pricing calculator
- [ ] Route optimization for riders

---

## Next Tasks
1. Test the complete flow: register → admin approval → login → dashboard
2. Configure Resend API for production email delivery
3. Add proof of delivery photo upload for riders
4. Implement real-time notifications
