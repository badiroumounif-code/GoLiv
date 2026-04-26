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

## How to seed a fresh admin
```bash
curl -X POST "$REACT_APP_BACKEND_URL/api/auth/init-admin"
```

## API base URL
`https://plb-track.preview.emergentagent.com/api` (URL kept for deployment continuity despite GoLiv rebrand)
