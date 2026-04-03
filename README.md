# Finance Data Processing and Access Control Backend

A clean, well-structured REST API for a finance dashboard system. Built with **Node.js**, **Express**, and **SQLite** — no heavy infrastructure required.

---

## Tech Stack

| Layer        | Choice                              | Reason                                      |
|--------------|-------------------------------------|---------------------------------------------|
| Runtime      | Node.js                             | Widely used, async-friendly                 |
| Framework    | Express.js                          | Minimal, flexible, industry standard        |
| Database     | SQLite (via `better-sqlite3`)       | File-based, zero setup, great for demos     |
| Auth         | JWT (`jsonwebtoken`) + bcrypt       | Stateless, secure, simple to inspect        |
| Validation   | Zod                                 | Type-safe schema validation                 |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                  # Entry point — wires routes and middleware
│   ├── controllers/
│   │   ├── authController.js   # Login, register, me
│   │   ├── userController.js   # User CRUD
│   │   └── recordController.js # Financial record CRUD + dashboard
│   ├── services/
│   │   ├── authService.js      # Password hashing, JWT signing
│   │   ├── userService.js      # User business logic
│   │   └── recordService.js    # Record logic, access scoping, dashboard
│   ├── models/
│   │   ├── database.js         # SQLite connection + schema initialization
│   │   ├── userModel.js        # Raw DB queries for users
│   │   └── recordModel.js      # Raw DB queries for records + aggregations
│   ├── middleware/
│   │   ├── auth.js             # JWT verification + role authorization
│   │   ├── validate.js         # Zod validation middleware factory
│   │   └── errorHandler.js     # Centralized error handler
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── recordRoutes.js
│   └── utils/
│       └── response.js         # Response helper utilities
├── tests/
│   └── test.js                 # Integration tests (no framework needed)
├── scripts/
│   └── seed.js                 # Demo data seeder
├── .env.example
└── package.json
```

---

## Setup

```bash
# 1. Clone / download the project
cd finance-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set a strong JWT_SECRET

# 4. (Optional) Seed demo data
node scripts/seed.js

# 5. Start the server
npm start

# Development mode with auto-reload
npm run dev
```

The server starts on `http://localhost:3000` by default.

---

## Role Model

| Role        | View Records | Create/Update Records | Delete Records | Manage Users |
|-------------|:---:|:---:|:---:|:---:|
| **Viewer**  | Own only | ✗ | ✗ | ✗ |
| **Analyst** | All | Own only | Own only | ✗ |
| **Admin**   | All | Any | Any | Full |

---

## API Reference

All protected endpoints require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | `/api/auth/register`  | Public   | Create a new account     |
| POST   | `/api/auth/login`     | Public   | Log in, receive JWT      |
| GET    | `/api/auth/me`        | Any role | Get own profile          |

**Register**
```json
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",
  "role": "viewer"            // optional, defaults to "viewer"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "secret123"
}
// Response includes: { user, token }
```

---

### Users

| Method | Endpoint        | Auth        | Description             |
|--------|-----------------|-------------|-------------------------|
| GET    | `/api/users`    | Admin       | List all users          |
| GET    | `/api/users/:id`| Authenticated | Get user by ID        |
| PATCH  | `/api/users/:id`| Authenticated | Update user fields    |
| DELETE | `/api/users/:id`| Admin       | Delete user (hard)      |

**Update User (PATCH)**
```json
{
  "name": "New Name",
  "email": "new@email.com",
  "role": "analyst",         // admin only
  "status": "inactive"       // admin only
}
```

---

### Financial Records

| Method | Endpoint                        | Auth             | Description           |
|--------|---------------------------------|------------------|-----------------------|
| GET    | `/api/records`                  | Any role         | List records          |
| GET    | `/api/records/:id`              | Any role         | Get single record     |
| POST   | `/api/records`                  | Admin, Analyst   | Create record         |
| PATCH  | `/api/records/:id`              | Admin, Analyst   | Update record         |
| DELETE | `/api/records/:id`              | Admin, Analyst   | Soft delete record    |
| GET    | `/api/records/dashboard/summary`| Any role         | Dashboard analytics   |

**Query Parameters for GET /api/records**
```
?type=income          # Filter by type: income | expense
?category=Salary      # Filter by category
?startDate=2024-01-01 # Filter from date (YYYY-MM-DD)
?endDate=2024-03-31   # Filter to date (YYYY-MM-DD)
?limit=20             # Records per page (default: 50)
?offset=0             # Pagination offset (default: 0)
```

**Create Record (POST)**
```json
{
  "amount": 5000.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-01-15",
  "notes": "Monthly salary"  // optional
}
```

**Dashboard Summary Response**
```json
{
  "overview": {
    "total_income": 100000,
    "total_expenses": 5000,
    "net_balance": 95000,
    "total_records": 12
  },
  "category_breakdown": [
    { "category": "Salary", "type": "income", "total": 85000 }
  ],
  "monthly_trends": [
    { "month": "2024-03", "income": 95000, "expenses": 1500 }
  ],
  "recent_activity": [ ... ]
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [                         // present only on validation failures
    { "field": "amount", "message": "Amount must be a positive number" }
  ]
}
```

| Status | Meaning                          |
|--------|----------------------------------|
| 400    | Validation failed                |
| 401    | Missing or invalid token         |
| 403    | Insufficient permissions         |
| 404    | Resource not found               |
| 409    | Conflict (duplicate email, etc.) |
| 500    | Internal server error            |

---

## Running Tests

```bash
# Start the server first
npm start

# In another terminal
npm test
```

Tests cover: auth flow, role-based access control, CRUD operations, validation, filtering, dashboard aggregation, and soft delete.

---

## Design Decisions & Assumptions

1. **SQLite over PostgreSQL/MySQL** — Zero infrastructure setup. Swap the database layer in `src/models/database.js` for a production DB without changing any service or controller code.

2. **Soft delete on records** — Financial records are never hard-deleted. The `is_deleted` flag preserves audit history while hiding records from normal queries.

3. **Role hierarchy is additive** — Admins have all analyst permissions plus user management. Analysts have all viewer permissions plus write access.

4. **Analysts own their records** — An analyst can create, update, and delete records they created. Admins have no such restriction.

5. **JWT is stateless** — No session store needed. Tokens expire after 7 days (configurable). Token revocation on logout is not implemented but can be added via a Redis blocklist.

6. **Zod for validation** — Validation schemas live in one file (`middleware/validate.js`), making them easy to audit and update.

7. **No soft delete on users** — Users are hard-deleted, which cascades to their records via SQLite foreign key constraints. This keeps the user table clean.
