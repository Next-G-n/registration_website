# RegistrationAPP API Contract

This document explains the API behavior in plain terms for frontend developers and stakeholders.

Primary source: `docs/openapi.yaml`.

## What this system does

- Multi-tenant visitor registration.
- Staff/admin users authenticate with JWT.
- Visitors do not authenticate; they use QR-driven public endpoints (`public_key`).

## Roles and Access

- `platform_super_admin`
  - Can manage organizations.
  - Can view platform aggregate analytics only.
- `org_admin`
  - Can manage org registration points, departments, users, and settings.
  - Can view org visits, person history, and org analytics.
- `staff`
  - Can view org visits, person history, and org analytics.
- Public visitor flow
  - No JWT required.
  - Access is controlled by `public_key` attached to a registration point.

## Tenant Isolation Rules

- Every org-protected route is scoped by the authenticated user's `org_id`.
- Cross-org data access is forbidden.
- Platform analytics must remain aggregated (no raw person-level cross-org PII).

## Public QR Flow

- Registration points expose a `public_key`.
- QR code resolves to public endpoints using that key.
- Check-in creates a visit and returns a `visit_code`.
- Checkout accepts either `visit_code` or `id_number`.

## Privacy Rules

- Responses should return masked IDs (`id_last4`, `id_masked`) and never raw `id_number`.
- Raw `id_number` should not be logged.
- If raw ID storage is enabled by org setting, it is an explicit org-level policy, not default behavior.

## Auth and Headers

### Protected endpoints

Send JWT in header:

```http
Authorization: Bearer <access_token>
```

### Public endpoints

- No JWT.
- Optional `Idempotency-Key` header for client retry safety.

## Error Format (standardized)

All non-2xx responses should use:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {
      "fields": [
        { "field": "email", "issue": "value is not a valid email address" }
      ]
    },
    "trace_id": "req_123abc"
  }
}
```

## Quickstart (frontend)

1. `POST /auth/login` and store `access_token`.
2. Use token for protected endpoints.
3. For visitor flow:
   - `POST /public/p/{public_key}/checkin`
   - Save `visit_code`
   - `POST /public/p/{public_key}/checkout`
4. Display domain errors clearly:
   - `404`: bad/missing public key or active visit not found
   - `409`: state conflict
   - `429`: rate limit

## Curl Examples

### 1) Login

```bash
curl -X POST 'https://api.example.com/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"change-me"}'
```

### 2) Current user

```bash
curl 'https://api.example.com/auth/me' \
  -H 'Authorization: Bearer <TOKEN>'
```

### 3) Create registration point (org_admin)

```bash
curl -X POST 'https://api.example.com/org/registration-points' \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Main Lobby Kiosk","department_id":3}'
```

### 4) Public check-in

```bash
curl -X POST 'https://api.example.com/public/p/pkey_2hB0jQ6Q5sxQYB1k/checkin' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 4cf0f6a8-e5f8-4ce8-9fda-6f2a108b8c71' \
  -d '{
    "full_name":"Jane Doe",
    "age":29,
    "gender":"female",
    "id_type":"national_id",
    "id_number":"A123456789",
    "phone":"+15551234567",
    "purpose":"Vendor meeting",
    "notes":"Arrived at gate 2"
  }'
```

### 5) Public checkout by visit_code

```bash
curl -X POST 'https://api.example.com/public/p/pkey_2hB0jQ6Q5sxQYB1k/checkout' \
  -H 'Content-Type: application/json' \
  -d '{"visit_code":"VIS-hx7K2Q"}'
```

## Notes on Backend Alignment

This contract is contract-first and intentionally standardized. Current backend implementation may differ in two areas:

- Query names for visits in code are `start_date` and `end_date`; contract uses `from` and `to`.
- Some current backend errors may still return FastAPI default `{ "detail": ... }`; contract requires `{ "error": ... }` envelope.

Backend should be updated to match `docs/openapi.yaml` as the API source of truth.
