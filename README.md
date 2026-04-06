# Finance Dashboard Backend

A RESTful API for managing users, financial records, and aggregated dashboard analytics with role-based access control (RBAC).

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Query Builder**: Knex.js
- **Validation**: Zod
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Testing**: Jest + fast-check (property-based testing)

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_dashboard
JWT_SECRET=your-secret-here
```

### 3. Start PostgreSQL (Docker)

```bash
docker run --name finance-pg \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=finance_dashboard \
  -p 5432:5432 \
  -d postgres:16
```

### 4. Run migrations

```bash
npx knex migrate:latest --knexfile knexfile.ts
```

### 5. Seed admin user

```bash
npx ts-node seed-admin.ts
```

This creates: `admin / admin123`

### 6. Start the server

```bash
npm run dev        # development (ts-node)
npm run build      # compile to dist/
npm start          # production (compiled)
```

Server runs on `http://localhost:3000` by default.

---

## Running Tests

```bash
npm test
```

213 tests across 15 suites covering unit, service, handler, middleware, and property-based tests.

---

## Project Structure

```
src/
  types/          # Domain types and Express augmentation
  errors/         # Custom error classes
  middleware/     # authenticate, requireRole, validateBody/Query, errorHandler
  validators/     # Zod schemas
  repositories/   # Knex DB layer (UserRepository, RecordRepository)
  services/       # Business logic (UserService, RecordService, DashboardService)
  handlers/       # Express route handlers
  routers/        # Express routers
  db.ts           # Knex instance + health check
  app.ts          # Express app factory
  index.ts        # Server entry point
migrations/       # Knex migration files
tests/
  unit/           # Unit tests (mocked dependencies)
  property/       # Property-based tests (fast-check)
```

---

## RBAC Permission Matrix

| Endpoint Group        | Viewer | Analyst | Admin |
|-----------------------|--------|---------|-------|
| Dashboard (read)      | ✓      | ✓       | ✓     |
| Records (read)        | ✗      | ✓       | ✓     |
| Records (write/delete)| ✗      | ✗       | ✓     |
| Users (all)           | ✗      | ✗       | ✓     |

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Auth

#### POST /auth/login
Authenticate and receive a JWT.

**Body:**
```json
{ "username": "admin", "password": "admin123" }
```

**Response 200:**
```json
{ "token": "<jwt>" }
```

---

### Users
> All user endpoints require `Admin` role.

#### POST /users
Create a new user.

**Body:**
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "role": "analyst"
}
```
**Response:** `201` with created user object.

#### GET /users
List all users. **Response:** `200` with array of users.

#### GET /users/:id
Get a user by ID. **Response:** `200` user object or `404`.

#### PATCH /users/:id
Update role or status.

**Body (all fields optional):**
```json
{ "role": "viewer", "status": "inactive" }
```
**Response:** `200` updated user or `404`.

#### DELETE /users/:id
Delete a user. **Response:** `204` or `404`.

---

### Financial Records

#### POST /records
> Requires `Admin` role.

Create a financial record.

**Body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-01",
  "notes": "April salary"
}
```
**Response:** `201` with created record.

#### GET /records
> Requires `Analyst` or `Admin` role.

List records with optional filters.

**Query params (all optional):**
| Param | Type | Description |
|-------|------|-------------|
| `start_date` | `YYYY-MM-DD` | Filter from date (inclusive) |
| `end_date` | `YYYY-MM-DD` | Filter to date (inclusive) |
| `category` | string | Case-insensitive match |
| `type` | `income` \| `expense` | Filter by type |
| `search` | string | Search in category or notes |
| `page` | number | Page number (default: all) |
| `limit` | number | Records per page |

**Response 200:**
```json
{
  "records": [...],
  "total": 42,
  "totalPages": 9
}
```

#### GET /records/:id
> Requires `Analyst` or `Admin` role.

Get a record by ID. **Response:** `200` or `404`.

#### PATCH /records/:id
> Requires `Admin` role.

Update a record. All fields optional.

**Body:**
```json
{ "amount": 5500, "category": "Bonus", "notes": "Updated" }
```
**Response:** `200` updated record or `404`.

#### DELETE /records/:id
> Requires `Admin` role.

Soft-deletes the record (sets `deleted_at`). **Response:** `204` or `404`.

#### PATCH /records/:id/restore
> Requires `Admin` role.

Restore a soft-deleted record. **Response:** `200` restored record or `404`.

---

### Dashboard
> All dashboard endpoints require `Viewer`, `Analyst`, or `Admin` role.

#### GET /dashboard/summary
Total income, expenses, and net balance.

**Query params (optional):** `start_date`, `end_date`

**Response 200:**
```json
{
  "totalIncome": 15000,
  "totalExpenses": 8000,
  "netBalance": 7000
}
```

#### GET /dashboard/categories
Totals grouped by category.

**Response 200:**
```json
[
  { "category": "Salary", "income": 10000, "expenses": 0 },
  { "category": "Rent", "income": 0, "expenses": 2000 }
]
```

#### GET /dashboard/recent
10 most recently updated records ordered by `updated_at` DESC.

#### GET /dashboard/trends/monthly
Income and expenses for the trailing 12 calendar months.

**Response 200:**
```json
[
  { "period": "2025-05", "income": 5000, "expenses": 2000 },
  ...
]
```

#### GET /dashboard/trends/weekly
Income and expenses for the trailing 8 ISO weeks.

**Response 200:**
```json
[
  { "period": "2026-W14", "income": 1200, "expenses": 800 },
  ...
]
```

---

## Error Responses

All errors follow a consistent shape:

```json
{ "error": "Human-readable message" }
```

Validation errors (400) also include field-level details:

```json
{
  "error": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" },
    { "field": "amount", "message": "Number must be greater than 0" }
  ]
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/username) |
| 500 | Unexpected server error |
