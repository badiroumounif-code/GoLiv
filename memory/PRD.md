# PLB Logistique - Product Requirements Document

## Original Problem Statement
Build a fully functional, interactive logistics website for PLB Logistique, operating in Benin (Cotonou, Porto-Novo, Calavi). The objective is creating a realistic, near-final product to observe real usage and gather insights before working with a full-time developer.

## User Personas
1. **Clients (Particuliers/Entreprises)** - Need to request deliveries across Benin
2. **Potential Merchant Partners** - Businesses looking to partner for regular deliveries
3. **Potential Rider Partners** - Individuals looking to become delivery riders
4. **Admin/Operations Team** - Need to view and manage all submissions

## Core Requirements (Static)
- French language only
- Light/soft color palette (sky blue, light grey, white)
- Mobile-first, responsive design
- Simple password protection for admin (plb2024)
- Email notifications for new requests (Resend integration ready)
- CSV export capability for all data

---

## What's Been Implemented

### December 2025 - Initial MVP

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

**Admin Dashboard:**
- ✅ Password-protected login (plb2024)
- ✅ Statistics overview (demandes, avis, commerçants, livreurs)
- ✅ Tabbed view for all data types
- ✅ CSV export for each category
- ✅ Detail modal for delivery requests

**Backend API:**
- ✅ All CRUD endpoints for delivery requests, feedback, merchants, riders, contacts
- ✅ Admin authentication
- ✅ CSV export endpoints
- ✅ Stats endpoint
- ✅ Email notification system (requires Resend API key configuration)

**Design:**
- ✅ Light sky blue theme
- ✅ Manrope headings + Inter body fonts
- ✅ Rounded cards with soft shadows
- ✅ Professional logistics imagery
- ✅ Responsive mobile design

---

## Prioritized Backlog

### P0 - Critical (For Production)
- [ ] Configure Resend API key + admin email for notifications
- [ ] Update contact phone number and email with real values
- [ ] Set a secure admin password

### P1 - High Priority
- [ ] Add WhatsApp direct link in contact section
- [ ] Add delivery tracking system
- [ ] SMS notifications (Twilio integration)
- [ ] Real-time delivery status updates

### P2 - Medium Priority
- [ ] Multi-language support (English)
- [ ] Customer accounts with order history
- [ ] Advanced admin features (status updates, assign riders)
- [ ] Payment integration (Stripe/PayPal)

### P3 - Nice to Have
- [ ] Mobile app
- [ ] Real-time GPS tracking
- [ ] Automated pricing calculator
- [ ] Analytics dashboard

---

## Technical Architecture

**Frontend:** React + Tailwind CSS + Shadcn UI + Framer Motion
**Backend:** FastAPI (Python)
**Database:** MongoDB
**Hosting:** Emergent Platform

**Key Files:**
- `/app/backend/server.py` - Main API
- `/app/frontend/src/App.js` - React routes
- `/app/frontend/src/pages/` - All page components
- `/app/frontend/src/components/` - Shared components

---

## Next Tasks
1. Add Resend API key to enable email notifications
2. Update contact information with real phone/email
3. Test full user flow with real submissions
4. Gather user feedback from initial testing phase
