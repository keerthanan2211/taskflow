# TaskFlow

[![CI](https://github.com/keerthanan2211/taskflow/actions/workflows/ci.yml/badge.svg)](https://github.com/keerthanan2211/taskflow/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A real-time project management app for small teams. Create projects, invite teammates, and move tasks across a shared Kanban board. When one person drags a card, everyone else on the project sees it move.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · NestJS · PostgreSQL · Prisma · Socket.IO · Docker · GitHub Actions

**Demo account** (created by the seed script): `demo@taskflow.dev` / `Demo#2026`

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Real-time events](#real-time-events)
- [Engineering decisions](#engineering-decisions)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Features

**Boards and tasks**
- Four-column board: To do, In progress, In review, Done
- Drag and drop between and within columns, with mouse, touch or keyboard
- Optimistic updates: cards land instantly, and roll back if the server rejects the move
- Task details: title, description, priority, assignee, due date, and overdue highlighting
- Quick-add a task at the bottom of any column

**Collaboration**
- Live updates over WebSockets: task changes and new comments appear for everyone on the project
- Comments on every task
- Invite teammates by email, with Owner, Admin and Member roles

**Security**
- JWT authentication with bcrypt password hashing
- Every project-scoped request is checked for membership on the server
- Non-members get a 404 rather than a 403, so project IDs can't be probed
- Request validation with `class-validator`; unknown fields are rejected

**Accessibility**
- Keyboard drag and drop (Space to pick up, arrow keys to move, Space to drop)
- Screen reader announcements for every drag action
- Native `<dialog>` modals with focus trapping and Escape to close
- Labelled form fields with errors linked via `aria-describedby`
- Visible focus styles, `prefers-reduced-motion` support, and light and dark themes

---

## Tech stack

| Layer | Technology | Why |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router), React 18, TypeScript | File-based routing, production build optimisation, type safety |
| Styling | Tailwind CSS with CSS-variable design tokens | One set of class names for light and dark themes |
| Server state | TanStack React Query | Caching, background refetching, optimistic updates |
| Client state | Zustand (persisted) | Small, simple session store |
| Forms | React Hook Form + Zod | Fast forms with typed, reusable validation schemas |
| Drag and drop | dnd-kit | Accessible, keyboard-friendly drag and drop |
| Backend | NestJS 10 | Modular structure, dependency injection, guards and pipes |
| Database | PostgreSQL 16 + Prisma ORM | Relational data with type-safe queries and migrations |
| Real-time | Socket.IO | Rooms per project, automatic reconnection |
| API docs | Swagger (OpenAPI) | Interactive docs at `/docs` |
| Testing | Jest (API), Vitest (web) | Unit tests for core logic |
| DevOps | Docker, Docker Compose, GitHub Actions | One-command local stack and CI on every push |

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI[Next.js app<br/>React Query + Zustand]
    end

    subgraph API[NestJS API]
        REST[REST controllers<br/>JWT guard + validation]
        SVC[Services<br/>membership checks]
        GW[Socket.IO gateway<br/>room per project]
    end

    DB[(PostgreSQL)]

    UI -- HTTPS / JSON --> REST
    REST --> SVC
    SVC -- Prisma --> DB
    SVC -- emit event --> GW
    GW -- task.updated, comment.created --> UI
```

**How a drag-and-drop move works:**

1. The user drops a card. React Query updates the board immediately (optimistic update).
2. The browser sends `PATCH /tasks/:id/move` with the target column and index.
3. The API checks the user is a project member, then computes a new position in a database transaction.
4. The API emits `task.updated` to the project's Socket.IO room.
5. Every other teammate's board refetches and shows the new order.
6. If the request fails, the card returns to where it was and an error is shown.

---

## Project structure

```
taskflow/
├── apps/
│   ├── api/                         NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma        Data model
│   │   │   ├── migrations/          SQL migrations
│   │   │   └── seed.ts              Demo data
│   │   └── src/
│   │       ├── auth/                Register, login, JWT strategy and guard
│   │       ├── projects/            Projects, members, role checks
│   │       ├── tasks/               Task CRUD, move logic, fractional positions
│   │       ├── comments/            Task comments
│   │       ├── realtime/            Socket.IO gateway
│   │       ├── prisma/              Prisma service (database client)
│   │       ├── common/              Shared decorators and helpers
│   │       └── main.ts              Bootstrap, CORS, validation, Swagger
│   └── web/                         Next.js frontend
│       └── src/
│           ├── app/                 Routes: /login, /register, /projects, /projects/[id]
│           ├── components/
│           │   ├── board/           Board, columns, cards, task and member dialogs
│           │   └── ui/              Button, form fields, dialog, avatar
│           ├── hooks/               React Query hooks (projects, board, realtime)
│           └── lib/                 API client, auth store, socket, board logic
├── .github/workflows/ci.yml         Lint, typecheck, test and build on every push
└── docker-compose.yml               PostgreSQL + API + web in one command
```

---

## Getting started

### Option 1: Docker (fastest)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone https://github.com/keerthanan2211/taskflow.git
cd taskflow
docker compose up --build
```

Then, in a second terminal, load the demo data:

```bash
docker compose exec api node dist/seed/seed.js
```

Open:
- App: http://localhost:3000
- API docs: http://localhost:4000/docs

Sign in with `demo@taskflow.dev` / `Demo#2026`.

### Option 2: Run locally

**Prerequisites:** Node.js 20+, and PostgreSQL 14+ running locally (or a free [Neon](https://neon.tech) database).

**1. Install dependencies**

```bash
git clone https://github.com/keerthanan2211/taskflow.git
cd taskflow
npm run install:all
```

**2. Configure the API**

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` and set `DATABASE_URL` to your database and `JWT_SECRET` to a long random string (`openssl rand -hex 32`).

**3. Create the tables and demo data**

```bash
npm run db:migrate
npm run db:seed
```

**4. Configure the web app**

```bash
cp apps/web/.env.example apps/web/.env.local
```

**5. Start both apps** (two terminals)

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:3000
```

**Try real-time updates:** open the same project in two browser windows (one normal, one incognito, signed in as `demo@taskflow.dev` and `priya@taskflow.dev`, both with password `Demo#2026`). Drag a card in one window and watch it move in the other.

---

## Environment variables

### API (`apps/api/.env`)

| Variable | Example | Description |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/taskflow` | PostgreSQL connection string |
| `JWT_SECRET` | `3f9a…` | Secret used to sign access tokens. Keep it private. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `PORT` | `4000` | Port the API listens on |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin(s), comma-separated |

### Web (`apps/web/.env.local`)

| Variable | Example | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Base URL of the API |

---

## API reference

Full interactive documentation is available at **`/docs`** (Swagger) when the API is running. All routes except register, login and health require `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account, returns a token |
| `POST` | `/auth/login` | Sign in, returns a token |
| `GET` | `/auth/me` | Current user |
| `GET` | `/projects` | Projects you belong to, with task and member counts |
| `POST` | `/projects` | Create a project (you become the owner) |
| `GET` | `/projects/:id` | Project details and members |
| `PATCH` | `/projects/:id` | Rename or update description (owner, admin) |
| `DELETE` | `/projects/:id` | Delete a project (owner) |
| `POST` | `/projects/:id/members` | Add a member by email (owner, admin) |
| `DELETE` | `/projects/:id/members/:userId` | Remove a member (owner, admin) |
| `GET` | `/projects/:id/tasks` | All tasks on the board |
| `POST` | `/projects/:id/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update title, description, priority, assignee or due date |
| `PATCH` | `/tasks/:id/move` | Move to `{ status, index }` |
| `DELETE` | `/tasks/:id` | Delete (creator, owner or admin) |
| `GET` | `/tasks/:id/comments` | Comments on a task |
| `POST` | `/tasks/:id/comments` | Add a comment |
| `GET` | `/health` | API and database health check |

**Example: create a task**

```bash
curl -X POST http://localhost:4000/projects/<projectId>/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Build pricing page", "priority": "HIGH", "dueDate": "2026-12-15" }'
```

---

## Real-time events

The client connects to the `/realtime` Socket.IO namespace with its JWT:

```ts
io(`${API_URL}/realtime`, { auth: { token } });
socket.emit('project.join', projectId); // server checks membership before joining the room
```

| Event | Payload | Sent when |
| --- | --- | --- |
| `task.created` | `{ payload: Task, actorId }` | A task is created |
| `task.updated` | `{ payload: Task, actorId }` | A task is edited or moved |
| `task.deleted` | `{ payload: { id }, actorId }` | A task is deleted |
| `comment.created` | `{ payload: Comment, actorId }` | A comment is posted |

Sockets with a missing or invalid token are disconnected, and a user can only join rooms for projects they belong to.

---

## Engineering decisions

**Fractional indexing for task order.** Each task stores a floating-point `position`. Dropping a card between two others gives it the midpoint of their positions, so a move updates one row instead of renumbering the whole column. If two neighbours get too close after many moves, that column is rebalanced inside the same transaction. See `apps/api/src/tasks/position.ts`.

**One place for authorisation.** `ProjectsService.assertMember()` is the single check used by every project, task, comment and socket operation, optionally with required roles. This makes it hard to add an endpoint that forgets a permission check.

**Server-authoritative moves.** The client sends a target column and index, not a position. The server works out the position from the current database state, so two people dragging at the same time can't corrupt the order.

**Optimistic UI with rollback.** React Query's `onMutate` updates the cache before the request finishes, keeps the previous state, and restores it in `onError`. The board stays fast even on slow connections.

**Pure, tested board logic.** Grouping and moving tasks live in `apps/web/src/lib/board.ts` as pure functions, which makes them easy to unit test and reuse in both the drag handlers and the optimistic update.

---

## Testing

```bash
npm test             # runs API (Jest) and web (Vitest) tests
npm run typecheck    # TypeScript checks for both apps
```

- **API:** fractional positioning, rebalancing, and membership/role authorisation
- **Web:** board grouping, cross-column moves, reordering, and immutability

CI (`.github/workflows/ci.yml`) runs lint, type checks, tests and production builds for both apps on every push and pull request.

---

## Deployment

A free-tier setup that works well:

| Part | Service | Notes |
| --- | --- | --- |
| Database | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Copy the connection string into `DATABASE_URL` |
| API | [Render](https://render.com) or [Railway](https://railway.app) | Deploy `apps/api` with its Dockerfile. Set all API env vars. Migrations run on start. |
| Web | [Vercel](https://vercel.com) | Import the repo, set root directory to `apps/web`, set `NEXT_PUBLIC_API_URL` to your API URL |

After deploying, set the API's `CORS_ORIGIN` to your Vercel URL, then run the seed once from the Render/Railway shell: `npm run seed:prod`.

---

## Roadmap

- Refresh tokens in httpOnly cookies
- Email invitations for people without an account
- Activity history per task
- Labels, filters and search on the board
- End-to-end tests with Playwright

---

## License

MIT. Built by **Nichenametla Keerthana** · [LinkedIn](https://www.linkedin.com/in/nichenametla-keerthana/)
