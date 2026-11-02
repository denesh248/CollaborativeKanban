# Real-Time Collaborative Kanban Board

A multi-tenant, real-time collaborative Kanban board built for enterprise organizations with multiple branch locations (tenants), strict data isolation, role-based access control (RBAC), and optimistic concurrency handling.

Repository: [https://github.com/denesh248/CollaborativeKanban.git](https://github.com/denesh248/CollaborativeKanban.git)

---

## 1. Project Overview

Imagine an enterprise company called **ABC Technologies** with three separate branch locations:
- **Hyderabad Branch** (Project Engineering)
- **Bangalore Branch** (Cloud Infrastructure)
- **Chennai Branch** (QA & Testing)

Each branch has its own employees, project boards, columns, tasks, and audit logs. Employees in Hyderabad must **never** be able to view, edit, or receive real-time updates about tasks belonging to the Bangalore branch.

This project delivers **strict tenant-level data isolation** backed by **PostgreSQL** and **Prisma ORM**, powered by a **pure JavaScript** full-stack architecture with **Express.js** and **React + Vite**.

---

## 2. Technology Stack

- **Frontend**: React 18 + JavaScript + Vite
- **Styling**: Tailwind CSS + Lucide React icons
- **Backend**: Node.js + Express.js (ES Modules `"type": "module"`)
- **Database**: PostgreSQL
- **ORM**: Prisma ORM (JavaScript Client)
- **Authentication**: JWT + bcryptjs (Phase 2)
- **Real-Time Gateway**: Socket.IO with tenant room scoping (Phase 3)

---

## 3. Project Structure

This repository uses a clean monorepo architecture separating frontend and backend:

```
collaborative-kanban/
├── client/                     # Frontend (React 18 + Vite + JavaScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Top navbar with tenant scope preview
│   │   │   ├── LoginPlaceholder.jsx # Interactive demo accounts login UI
│   │   │   └── Overview.jsx        # Phase 1 architectural overview
│   │   ├── App.jsx             # Main application container
│   │   ├── main.jsx            # React 18 DOM root
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html              # Vite entrypoint
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── vite.config.js          # Vite server configuration
│   ├── .env.example            # Frontend environment template
│   ├── .gitignore              # Client git ignore rules
│   └── package.json            # Frontend dependencies & scripts
│
├── server/                     # Backend (Node.js + Express + JavaScript)
│   ├── prisma/
│   │   ├── schema.prisma       # 8-model PostgreSQL relational schema
│   │   └── seed.js             # Demo data seed script (ES module)
│   ├── src/
│   │   ├── config/
│   │   │   └── environment.js  # dotenv configuration
│   │   ├── controllers/
│   │   │   └── health.controller.js # Health endpoint logic
│   │   ├── lib/
│   │   │   └── prisma.js       # Prisma client singleton
│   │   ├── middleware/
│   │   │   └── error.middleware.js  # Global error handling
│   │   ├── routes/
│   │   │   ├── health.routes.js     # Health route definitions
│   │   │   └── index.js             # API route aggregator
│   │   ├── app.js              # Express app setup & middlewares
│   │   └── server.js           # HTTP server entrypoint
│   ├── .env.example            # Backend environment template
│   ├── .gitignore              # Server git ignore rules
│   └── package.json            # Backend dependencies & scripts
│
├── docs/                       # Architecture & Database Specifications
│   └── database.md             # ER diagram and 8-model documentation
│
├── .env.example                # Root environment template
├── .gitignore                  # Monorepo git ignore rules
└── README.md                   # Project documentation
```

---

## 4. Database Schema (8 Core Models)

Implemented in `server/prisma/schema.prisma` with PostgreSQL:

1. **`organizations`**: Parent corporate entity (e.g. ABC Technologies).
2. **`tenants`**: Branch workspaces (Hyderabad, Bangalore, Chennai).
3. **`users`**: Employee accounts with hashed passwords.
4. **`memberships`**: RBAC permissions (`ORG_ADMIN`, `TENANT_ADMIN`, `MEMBER`).
5. **`boards`**: Kanban boards scoped to a tenant.
6. **`columns`**: Workflow status columns (`position` ordered).
7. **`tasks`**: Kanban work items with `position` ordering and monotonic `version` for Optimistic Concurrency Control (OCC).
8. **`activity_logs`**: Tenant audit trail (`user_id` set to null on user deletion to preserve historical logs).

Full entity relationships and ER diagram are available in [`docs/database.md`](docs/database.md).

---

## 5. Seeded Demo Accounts & Credentials

The seed script creates the following test users across branches. All accounts share the same default password:

**Default Password**: `Password123!`

| Full Name | Email | Organization | Branch (Tenant) | RBAC Role | Access Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul@abctech.com` | ABC Technologies | Hyderabad | `ORG_ADMIN` | All branches + Org settings |
| **Priya Patel** | `priya@abctech.com` | ABC Technologies | Hyderabad | `TENANT_ADMIN` | Hyderabad branch management |
| **Arjun Reddy** | `arjun@abctech.com` | ABC Technologies | Hyderabad | `MEMBER` | Hyderabad boards & tasks |
| **Sneha Rao** | `sneha@abctech.com` | ABC Technologies | Bangalore | `TENANT_ADMIN` | Bangalore branch management |
| **Vikram Das** | `vikram@abctech.com` | ABC Technologies | Chennai | `MEMBER` | Chennai boards & tasks |

---

## 6. Getting Started & Installation

### Prerequisites
- **Node.js**: v18 or higher (tested on Node v26)
- **npm**: v9 or higher
- **PostgreSQL**: Local PostgreSQL server or free cloud instance (Neon, Supabase)

### Step 1: Clone the Repository
```bash
git clone https://github.com/denesh248/CollaborativeKanban.git
cd CollaborativeKanban
```

### Step 2: Configure Environment Variables
Copy `.env.example` in both `server/` and `client/`:

```bash
# In server folder
cp server/.env.example server/.env

# In client folder
cp client/.env.example client/.env
```

Open `server/.env` and update `DATABASE_URL` with your PostgreSQL credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/collaborative_kanban?schema=public"
```

### Step 3: Setup Backend & Database
```bash
cd server
npm install

# Generate Prisma Client
npm run prisma:generate

# Apply Database Migrations (or push schema)
npx prisma db push

# Seed Sample Data (Orgs, Tenants, Users, Boards, Tasks)
npm run prisma:seed

# Start the Backend Server
npm run dev
```
Backend will start on: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

### Step 4: Setup Frontend Client
In a new terminal window:
```bash
cd client
npm install

# Start the Vite development server
npm run dev
```
Frontend will start on: `http://localhost:5173`

---

## 7. Implementation Roadmap & Current Status

- [x] **Phase 1: Project Foundation & Database Setup** (Completed)
  - Monorepo folder structure (`client/`, `server/`, `docs/`)
  - Pure JavaScript implementation with ES modules
  - Express server with health check endpoint (`/api/health`)
  - Prisma schema with all 8 models, foreign keys, and indexes
  - Comprehensive seed script with 5 accounts across 3 branches
  - React + Vite + Tailwind CSS frontend layout with interactive credentials helper
- [ ] **Phase 2: Authentication, Tenant Scoping & RBAC** (Next)
  - User registration & login with JWT
  - Password verification with bcryptjs
  - Tenant context middleware (`requireTenantContext`)
  - RBAC permission guards (`requireRole`)
- [ ] **Phase 3: REST API Endpoints**
  - CRUD for Organizations, Tenants, Boards, Columns, and Tasks
  - Concurrency checks (`HTTP 409 Conflict`)
- [ ] **Phase 4: Real-Time Communication (Socket.IO)**
  - Tenant-scoped WebSocket rooms (`tenant:<id>`)
  - Multi-tab presence indicators
  - Live task card sync & activity logs
- [ ] **Phase 5: Kanban UI & Drag-and-Drop**
  - Board view with `@dnd-kit`
  - Optimistic UI updates with undo/redo
- [ ] **Phase 6: Conflict Resolution & Network Reconnection**
- [ ] **Phase 7: Packaging & Final Deliverables**
