# Test Credentials — GoLiv Logistique

> Real credentials must NOT be committed to this repo. Store them in a local,
> gitignored `.env` (or your secrets manager) — never in this file.
> Any password previously written here has been exposed via Git history and
> must be rotated (see `backend/server.py`'s `ADMIN_PASSWORD` / `JWT_SECRET`
> env vars).

## Admin
- **Email:** `admin@plb.bj`
- **Password:** set via the `ADMIN_PASSWORD` env var (see `.env`, not committed)
- **Role:** `admin`
- **Login URL:** `/connexion`
- **Dashboard:** `/admin`
- **Init endpoint (creates if missing):** `POST /api/auth/init-admin`

## Existing Rider (created in previous session, may or may not still exist)
- **Email:** kept in local `.env` / secrets manager, not committed
- **Password:** kept in local `.env` / secrets manager, not committed
- **Dashboard:** `/espace-livreur`

## Google OAuth Users
- New Google OAuth users are automatically created as **merchants** (role: `merchant`)
- Google users have `auth_provider: "google"` and no password (cannot use email/password login)
- Existing users can link their account by logging in with the same email via Google
- Default dashboard for Google users: `/espace-commercant`

## How to seed a fresh admin
```bash
curl -X POST "$REACT_APP_BACKEND_URL/api/auth/init-admin?password=$ADMIN_PASSWORD"
```

## API base URL
`https://plb-track.preview.emergentagent.com/api` (URL kept for deployment continuity despite GoLiv rebrand)
