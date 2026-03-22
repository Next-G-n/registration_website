# RegistrationFrontend

React + TypeScript frontend for a QR-based multi-tenant visitor registration system. Built with Vite, React Router, TanStack Query, Tailwind, React Hook Form, Zod, and a generated OpenAPI client.

## Prerequisites
- Node.js 18+
- npm

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file at the project root:

```bash
VITE_API_BASE_URL=https://registration-api-pdvk.onrender.com
# Optional kiosk dropdown config for public check-in:
# VITE_KIOSK_DEPARTMENTS=[{"id":1,"label":"Front Desk"},{"id":2,"label":"HR"}]
# VITE_KIOSK_PURPOSES=["Meeting","Interview","Delivery","Service","Other"]
# VITE_KIOSK_COUNTRIES=["Botswana","South Africa","Namibia","Zimbabwe","Zambia","Other"]
```

3. Generate the OpenAPI client/types (uses `docs/openapi.yaml` by default):

```bash
npm run api:gen
```

If you prefer to generate from a running backend, set `API_BASE_URL` and re-run:

```bash
API_BASE_URL=https://registration-api-pdvk.onrender.com npm run api:gen
```

4. Run the app:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Notes
- OpenAPI types are generated into `src/api/generated` via `npm run api:gen`. Do not edit generated files manually.
- Auth token is stored in `localStorage` (MVP).
- API base URL is read from `VITE_API_BASE_URL`.
- Public kiosk routes are under `/p/:publicKey`.
- Invite acceptance route is `/invite/:token`.
- Protected portal routes are under `/app`.
