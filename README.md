# Finance Dashboard Backend

A role-based finance management REST API built with **Node.js**, **Express**, and **PostgreSQL**.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js | 
| Database | PostgreSQL | 
| Auth | JWT (jsonwebtoken) | 
| Validation | express-validator |
| API Docs | Swagger / OpenAPI 3.0 |
| Security | bcryptjs + rate-limit |

---

## Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   ├── db.js          # PostgreSQL connection pool
│   │   ├── migrate.js     # Schema creation script
│   │   ├── seed.js        # Sample data + test users
│   │   └── swagger.js     # OpenAPI spec config
│   ├── controllers/       # Request/response handlers (thin layer)
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js        # JWT verification + role guards
│   │   ├── errorHandler.js# Global error + 404 handler
│   │   └── validate.js    # express-validator result handler
│   ├── models/            # (Reserved for ORM layer if added later)
│   ├── routes/            # Express routers with Swagger JSDoc
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── dashboard.js
│   ├── services/          # Business logic lives here
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── recordService.js
│   │   └── dashboardService.js
│   ├── validators/
│   │   └── index.js       # All validation rule sets
│   └── index.js           # App entry point
├── .env.example
├── package.json
└── README.md
```

---

## Setup & Installation

### 1. Clone and install dependencies
```bash
cd finance-dashboard
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a strong JWT_SECRET
```

### 3. Create the database
```bash
# In psql or pgAdmin:
CREATE DATABASE finance_dashboard;
```

### 4. Run migrations (creates tables)
```bash
npm run db:migrate
```

### 5. Seed sample data
```bash
npm run db:seed
```

### 6. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

---

## API Documentation

Once running, open **http://localhost:3000/api/docs** in your browser.

### How to Start in Swagger
1. Use `POST /api/auth/login` with one of the seeded credentials below
2. Copy the `token` from the response
3. Click **Authorize** (top right) and then paste `Bearer <your_token>`
4. All subsequent requests will be authenticated

---

## Seeded Test Credentials

| Role | Email | Password | Can do |
|---|---|---|---|
| Admin | admin@finance.com | Admin@1234 | Everything |
| Analyst | analyst@finance.com | Analyst@1234 | View records, summaries, insights |
| Viewer | viewer@finance.com | Viewer@1234 | View records and basic dashboard |

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Login, get JWT |
| GET | /api/auth/me | All | Get own profile |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/users | Admin | List all users (paginated) |
| GET | /api/users/:id | Admin | Get single user |
| PATCH | /api/users/:id | Admin | Update name/role/status |
| DELETE | /api/users/:id | Admin | Soft-delete user |

### Financial Records
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/records | All | List records (own / all for admin) |
| GET | /api/records/:id | All | Get single record |
| POST | /api/records | Admin | Create record |
| PATCH | /api/records/:id | Admin | Update record |
| DELETE | /api/records/:id | Admin | Soft-delete record |

### Dashboard Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /api/dashboard/summary | All | Total income, expenses, net balance |
| GET | /api/dashboard/categories | All | Category-wise totals |
| GET | /api/dashboard/trends/monthly | All | Monthly income vs expense |
| GET | /api/dashboard/trends/weekly | All | Weekly income vs expense |
| GET | /api/dashboard/recent | All | Recent activity feed |
| GET | /api/dashboard/top-categories | Analyst + Admin | Top spend categories with % |

### Record Filtering (GET /api/records)
| Query Param | Type | Example |
|---|---|---|
| page | integer | ?page=2 |
| limit | integer | ?limit=10 |
| type | income \| expense | ?type=expense |
| category | string (partial) | ?category=rent |
| from_date | YYYY-MM-DD | ?from_date=2024-01-01 |
| to_date | YYYY-MM-DD | ?to_date=2024-03-31 |
| sort_by | record_date \| amount \| category | ?sort_by=amount |
| sort_order | asc \| desc | ?sort_order=asc |
| user_id | integer (admin only) | ?user_id=3 |

---

## Role & Permission Matrix

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Login / Register | ✅ | ✅ | ✅ |
| View own records | ✅ | ✅ | ✅ |
| View all records | ❌ | ❌ | ✅ |
| Dashboard summary | ✅ | ✅ | ✅ |
| Category totals | ✅ | ✅ | ✅ |
| Trends | ✅ | ✅ | ✅ |
| Top categories (%) | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Design Decisions

### Architecture
The code is split into **controllers → services → database** layers. Controllers handle HTTP concerns only (parsing req, sending res). All business logic and DB queries live in services. This makes the logic easy to test independently.

### Soft Deletes
Both `users` and `financial_records` use a `deleted_at` timestamp column. Records are never physically removed, which is critical for financial auditing. All queries filter `WHERE deleted_at IS NULL`.

### Role Hierarchy
Roles follow a numeric hierarchy: `viewer=1`, `analyst=2`, `admin=3`. The `authorize()` middleware factory uses `>=` comparison so that higher roles always inherit lower-role permissions automatically.

### Access Scoping
Non-admin users can only see their own financial records. The `recordService` and `dashboardService` automatically inject a `user_id` filter based on the requesting user's role. Admins see everything by default.

### JWT Security
- Tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`)
- Every authenticated request re-fetches the user from the DB to catch mid-session deactivations
- Passwords are hashed with bcrypt at cost factor 12

### Rate Limiting
- Global: 200 requests / 15 min per IP
- Auth endpoints: 20 requests / 15 min per IP (brute-force protection)

---

## Optional Enhancements Implemented

- [x] JWT Authentication
- [x] Pagination on all list endpoints
- [x] Soft delete (users and records)
- [x] Swagger / OpenAPI 3.0 interactive docs
- [x] Rate limiting (global + auth-specific)
- [x] Input validation with descriptive error messages
- [x] PostgreSQL indexes for performance
- [x] Auto-updating `updated_at` via DB trigger
- [x] Role hierarchy (not just flat role checking)
- [x] Access scoping (users see only their own data)

---

## Health Check
```
GET /health
```
Returns server status, version, and timestamp. Use this to verify the server is running.
