# Test Credentials — GoLiv Logistique

> Note: legacy email/password preserved during PLB → GoLiv rebrand to avoid breaking auth and existing sessions.

## Admin
- **Email:** `admin@plb.bj`
- **Password:** `plb2024`
- **Role:** `admin`
- **Login URL:** `/connexion`
- **Dashboard:** `/admin`
- **Init endpoint (creates if missing):** `POST /api/auth/init-admin`

## Existing Rider (created in previous session, may or may not still exist)
- **Email:** `badirouadeniyi@gmail.com`
- **Password:** `PLB7514` (legacy auto-generated; kept for backward compat)
- **Dashboard:** `/espace-livreur`

## Google OAuth Users
- New Google OAuth users are automatically created as **merchants** (role: `merchant`)
- Google users have `auth_provider: "google"` and no password (cannot use email/password login)
- Existing users can link their account by logging in with the same email via Google
- Default dashboard for Google users: `/espace-commercant`

## How to seed a fresh admin
```bash
curl -X POST "$REACT_APP_BACKEND_URL/api/auth/init-admin?password=plb2024"
```

## API base URL
`https://plb-track.preview.emergentagent.com/api` (URL kept for deployment continuity despite GoLiv rebrand)
