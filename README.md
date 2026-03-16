# FacilitiesDesk

A facilities and maintenance ticket management system for property managers. Tenants report issues, workers get assigned and complete jobs, and the entire lifecycle is tracked in real time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend & API | Next.js 16 (App Router) + React 19 |
| Database | Supabase (PostgreSQL) |
| Real-Time Updates | Supabase Realtime (WebSocket) |
| Automation | n8n (external, see below) |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        External World                           │
│                                                                 │
│   Customer/Admin Email ──────────────────────────────────────┐ │
│                                                              │ │
│                        ┌──────────┐                          │ │
│                        │   n8n    │  ◄── Automation Layer    │ │
│                        └────┬─────┘                          │ │
│                             │ HTTP API calls                 │ │
└─────────────────────────────┼──────────────────────────────--┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      FacilitiesDesk App                         │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                  Next.js (this repo)                     │  │
│   │                                                          │  │
│   │  /dashboard        ← Admin Portal                        │  │
│   │  /portal/customer  ← Customer Portal                     │  │
│   │  /portal/worker    ← Worker Portal                       │  │
│   │                                                          │  │
│   │  /api/tickets      ← REST API (used by n8n + portals)    │  │
│   │  /api/workers                                            │  │
│   │  /api/customers                                          │  │
│   │  /api/ticket-events                                      │  │
│   └──────────────────────────────┬───────────────────────────┘  │
│                                  │                              │
│   ┌──────────────────────────────▼───────────────────────────┐  │
│   │               Supabase (PostgreSQL + Realtime)           │  │
│   │                                                          │  │
│   │  tickets · customers · workers · ticket_events           │  │
│   └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## n8n Automation Flows

n8n runs as a separate service and interacts with this app entirely via the REST API. There are 4 automation flows:

### Flow 1 — Inbound Email → Open Ticket
1. An email arrives at the admin inbox reporting a maintenance issue
2. n8n parses the email (sender, subject, body)
3. n8n calls `POST /api/tickets` with the extracted details
4. A new ticket is created with status `OPEN` and a `CREATED` event is logged

### Flow 2 — Ticket Assignment → Worker Email
1. n8n polls for `OPEN` tickets (`GET /api/tickets?status=OPEN`)
2. It matches the job type against available workers' skills (`GET /api/workers`)
3. n8n calls `PATCH /api/tickets/[id]` with the assigned `worker_id`
4. Status automatically moves to `ASSIGNED` and an `ASSIGNED` event is logged
5. n8n sends the worker an email with job details and an acceptance link

### Flow 3 — Worker Marks Job Done
1. Worker receives an email with a link to mark the job as complete
2. Clicking the link triggers n8n to call `PATCH /api/tickets/[id]` with `status: "COMPLETED"`
3. Alternatively, the worker can update the status directly from the Worker Portal
4. A `COMPLETED` event is logged and `done_at` is stamped

### Flow 4 — Ticket Closed → Customer Feedback
1. n8n detects a ticket has moved to `COMPLETED`
2. It sends the customer a closure email confirming the job is done
3. The email includes a link to submit feedback

---

## API Endpoints

All endpoints are under `/api/`. The app uses Next.js App Router API routes.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login with email + password. Returns session with role and linked entity. |

**Request body:**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin | customer | worker",
  "linkedId": "uuid or null",
  "name": "Display Name"
}
```

---

### Customers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/customers` | List all customers. Optional: `?email=` to filter by email. |
| `POST` | `/api/customers` | Create a new customer. |
| `GET` | `/api/customers/[id]` | Get a single customer by ID. |
| `PATCH` | `/api/customers/[id]` | Update customer fields. |
| `DELETE` | `/api/customers/[id]` | Delete a customer. |

---

### Workers

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/workers` | List all workers. Optional: `?skill=` to filter by skill tag. |
| `POST` | `/api/workers` | Create a new worker. |
| `GET` | `/api/workers/[id]` | Get a single worker by ID. |
| `PATCH` | `/api/workers/[id]` | Update worker fields. |
| `DELETE` | `/api/workers/[id]` | Delete a worker. |

---

### Tickets

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tickets` | List tickets. Filters: `?id=`, `?customer_email=`, `?worker_id=`, `?status=` |
| `POST` | `/api/tickets` | Create a new ticket. Auto-generates `ticket_ref` (e.g. `TKT-0042`) and logs a `CREATED` event. |
| `GET` | `/api/tickets/[id]` | Get a single ticket by ID. |
| `PATCH` | `/api/tickets/[id]` | Update a ticket. Auto-creates activity events and updates status timestamps. |
| `DELETE` | `/api/tickets/[id]` | Delete a ticket (cascades to ticket events). |

**PATCH behaviour:**
- Assigning a `worker_id` → status moves to `ASSIGNED`, `assigned_at` is stamped, `ASSIGNED` event created
- Setting `status: "IN_PROGRESS"` → `in_progress_at` stamped, `STATUS_CHANGE` event created
- Setting `status: "COMPLETED"` → `done_at` stamped, `COMPLETED` event created

---

### Ticket Events

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ticket-events` | List all events. Optional: `?ticket_id=` to filter. |
| `POST` | `/api/ticket-events` | Create a manual event/note on a ticket. |
| `GET` | `/api/ticket-events/[id]` | Get a single event. |
| `PATCH` | `/api/ticket-events/[id]` | Update an event. |
| `DELETE` | `/api/ticket-events/[id]` | Delete an event. |

---

### Aggregate

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/data` | Returns all customers, workers, tickets, and ticket_events in one response. Used for initial page load and sync. |

---

## Ticket Lifecycle

```
  Email received
       │
       ▼
    [ OPEN ]  ──────────────── n8n assigns worker
       │
       ▼
  [ ASSIGNED ]  ─────────────── Worker accepts / starts job
       │
       ▼
  [ IN_PROGRESS ]  ────────────── Worker completes job
       │
       ▼
  [ COMPLETED ]  ─────────────── Customer receives closure email
```

**Auto-timestamps set on each transition:**

| Status | Timestamp field |
|--------|----------------|
| OPEN | `created_at` |
| ASSIGNED | `assigned_at` |
| IN_PROGRESS | `in_progress_at` |
| COMPLETED | `done_at` |

Every transition is logged as a row in `ticket_events`.

---

## Roles & Portals

| Role | Login | Portal URL | Access |
|------|-------|-----------|--------|
| **admin** | `admin@facilitiesdesk.com` | `/dashboard` | Full CRUD on all tickets, customers, workers. Kanban and table views. |
| **customer** | customer email | `/portal/customer` | View own tickets, raise new tickets. |
| **worker** | worker email | `/portal/worker` | View assigned jobs, move status to In Progress or Completed. |

Session is stored in `localStorage` under the key `fd_session`.

---

## Database Schema

Hosted on Supabase (PostgreSQL). Schema defined in `supabase/schema.sql`.

### `user_accounts`
Stores login credentials for all three roles.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | PK |
| email | TEXT | Unique |
| password | TEXT | Plain text (demo only) |
| role | TEXT | `admin`, `customer`, or `worker` |
| linked_id | TEXT | NULL for admin; points to `customers.id` or `workers.id` |

### `customers`
Property tenants who raise tickets.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | PK |
| full_name | TEXT | |
| email | TEXT | Unique |
| phone | TEXT | |
| property_ref | TEXT | e.g. `Villa-12` |
| building_name | TEXT | |
| unit_number | TEXT | |
| area | TEXT | Neighbourhood |
| city | TEXT | |
| contract_expiry | DATE | |
| preferred_contact | TEXT | `email`, `whatsapp`, or `phone` |

### `workers`
Maintenance staff who are assigned tickets.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | PK |
| full_name | TEXT | |
| email | TEXT | Unique |
| skills | TEXT[] | e.g. `["plumbing", "electrical"]` |
| phone | TEXT | |
| is_active | BOOLEAN | Default `true` |
| open_tickets | INTEGER | Count of unresolved assigned tickets |

### `tickets`
The core entity. One ticket per maintenance job.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | PK |
| ticket_ref | TEXT | Auto-generated, e.g. `TKT-0001` |
| customer_email | TEXT | FK → `customers.email` |
| worker_id | TEXT | FK → `workers.id`, nullable |
| job_type | TEXT | `plumbing`, `electrical`, `hvac`, `carpentry`, `general` |
| urgency | TEXT | `low`, `medium`, `high` |
| status | TEXT | `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED` |
| ai_summary | TEXT | Issue description |
| eta_description | TEXT | Estimated time to complete |
| location_notes | TEXT | Where in the property |
| access_instructions | TEXT | How to access the unit |
| resolution_notes | TEXT | Populated on completion |
| reported_via | TEXT | `email`, `whatsapp`, `phone`, `manual` |
| created_at | TIMESTAMPTZ | |
| assigned_at | TIMESTAMPTZ | Set when worker is assigned |
| in_progress_at | TIMESTAMPTZ | Set when worker starts |
| done_at | TIMESTAMPTZ | Set when completed |

### `ticket_events`
Immutable activity log for every ticket.

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (UUID) | PK |
| ticket_id | TEXT | FK → `tickets.id` (CASCADE DELETE) |
| event_type | TEXT | `CREATED`, `ASSIGNED`, `STATUS_CHANGE`, `NOTE`, `COMPLETED` |
| actor | TEXT | Who triggered it: `Manager`, `Worker`, `System` |
| note | TEXT | Human-readable description |
| created_at | TIMESTAMPTZ | |

---

## Real-Time Sync

The app maintains live data across all connected browser tabs using two mechanisms:

1. **Supabase Realtime** — a persistent WebSocket connection that receives push notifications whenever any row in `customers`, `workers`, `tickets`, or `ticket_events` changes. UI updates instantly.

2. **30-second polling fallback** — every 30 seconds the app also fetches `GET /api/data` to catch any updates that may have been missed (e.g. if the WebSocket connection dropped while the tab was in the background).

---

## How to Run

### Prerequisites
- Node.js 18+
- A Supabase project with the schema from `supabase/schema.sql` applied

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install & Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@facilitiesdesk.com` | `admin123` |
| Customer | `sara.ibrahim@email.com` | `sara123` |
| Worker | `hassan@facilitiesdesk.com` | `hassan123` |

These are pre-populated on the login page as quick-access buttons.

---

## Project Structure

```
axeed-demo/
├── app/
│   ├── api/                    # REST API routes
│   │   ├── auth/login/
│   │   ├── customers/
│   │   ├── workers/
│   │   ├── tickets/
│   │   ├── ticket-events/
│   │   └── data/
│   ├── dashboard/              # Admin portal
│   │   ├── customers/
│   │   ├── workers/
│   │   └── tickets/
│   ├── portal/
│   │   ├── customer/           # Customer portal
│   │   └── worker/             # Worker portal
│   └── login/
├── components/                 # Shared UI components
├── lib/
│   ├── store.tsx               # Global state (React Context)
│   ├── auth-context.tsx        # Auth session context
│   └── supabase/               # Supabase client setup
├── types/
│   └── index.ts                # All TypeScript types
└── supabase/
    └── schema.sql              # Full DB schema + seed data
```
