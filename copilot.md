# PantryScan Family Hub — Copilot Context

This file gives GitHub Copilot the context it needs to generate consistent, on-pattern code for this repo. The source of truth for product decisions is `docs/prd.md`.

---

## Project Overview

**PantryScan** is a private family web hub. It started as a pantry inventory tracker and is growing into a full household platform: recipes, meal planning, grocery list generation, a shared calendar, and to-do lists. Each family member has their own login. A secondary goal is using this project as a hands-on learning environment for AI agent development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | .NET 10 minimal API (ASP.NET Core) |
| ORM | Dapper — parameterized SQL only, no magic |
| Database | SQL Server (`PantryScanDB` on `localhost,1433`) |
| Frontend (current) | Vanilla HTML/CSS/JavaScript — no build step, no framework |
| Frontend (planned) | React + TypeScript + Vite (`ui-react/`) — exploratory migration |
| AI runtime | Claude Code + slash commands in `.claude/commands/` |

---

## Folder Structure

```
PantryScan/
├── api/PantryScan.Api/
│   └── Program.cs          ← ALL API endpoints (minimal API, one file)
├── db/PantryScanDB/
│   └── dbo.*.sql           ← SQL schema files, one per table
├── docs/
│   ├── prd.md              ← Source of truth for product decisions
│   ├── agent-contract.md   ← REST request/response contracts for agents
│   ├── agent-readiness.md  ← Migration phase tracker
│   └── semantic-layer.md   ← Domain entity vocabulary
├── ui-react/               ← Planned React/TS/Vite frontend (exploratory)
├── .claude/commands/       ← Slash command agent prompts
├── agent-data-service.js   ← Frontend API adapter (centralized fetch)
├── index.html              ← Pantry inventory (current default landing page)
├── recipes.html            ← Recipe list
├── planner.html            ← Meal planner
├── shopping.html           ← Shopping list
├── calendar.html           ← Calendar (month-view grid)
├── todos.html              ← To-do lists with priorities and due dates
├── login.html              ← Auth sign-in page
└── barcode_scanner_page.html
```

---

## Coding Rules

- **All API endpoints live in `api/PantryScan.Api/Program.cs`** — do not split into controllers until the file exceeds ~1200 lines
- **New SQL tables** go in `db/PantryScanDB/dbo.TableName.sql`
- **Parameterized queries only** — Dapper handles this; never concatenate user input into SQL
- **Input validation:** always check required fields, trim strings, reject negative quantities
- **Error responses:** return `{ "error": "message" }` on 400/404; never throw unhandled exceptions to clients
- **No premature abstraction** — only introduce helpers when used in more than one place

---

## API Conventions

- Transport: JSON over HTTP
- Date format: `YYYY-MM-DD` for planner/calendar dates; ISO 8601 for datetimes
- All write endpoints accept optional `idempotencyKey` (UUID) and `audit` object
- Duplicate `idempotencyKey` returns `{ "idempotent": true }` instead of re-executing
- Every `DELETE` requires `?confirm=true` — omitting it returns `400`
- Every write is recorded in `dbo.AuditLog`

---

## Current API Surface

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/items` | List pantry items |
| POST | `/items` | Add pantry item |
| PUT | `/items/{id}` | Update item quantity |
| DELETE | `/items/{id}` | Remove item |
| GET | `/recipes` | List recipes |
| POST | `/recipes` | Create recipe |
| PUT | `/recipes/{id}` | Update recipe |
| DELETE | `/recipes/{id}` | Delete recipe |
| POST | `/recipes/bulk` | Bulk create/migrate recipes |
| GET | `/meal-plans` | Get meal plan entries (`?from=&to=`) |
| POST | `/meal-plans` | Create/upsert meal plan entry |
| POST | `/meal-plans/bulk` | Bulk upsert entries |
| DELETE | `/meal-plans` | Delete entry by date + mealType |
| PUT | `/meal-plans/note` | Upsert a day note |
| GET | `/shopping` | List shopping items |
| POST | `/shopping/items` | Add shopping item |
| PUT | `/shopping/items/{clientId}/check` | Check/uncheck item |
| DELETE | `/shopping/items/{clientId}` | Remove item |
| DELETE | `/shopping/checked` | Clear all checked items |
| POST | `/shopping/bulk` | Bulk add items |
| GET | `/calendar` | List calendar events (`?from=&to=`) |
| POST | `/calendar` | Create event |
| PUT | `/calendar/{id}` | Update event |
| DELETE | `/calendar/{id}` | Delete event |
| GET | `/todos` | List todos (`?list=&completed=`) |
| POST | `/todos` | Create todo |
| PUT | `/todos/{id}` | Update todo |
| PUT | `/todos/{id}/complete` | Toggle complete |
| DELETE | `/todos/{id}` | Delete todo |
| GET | `/todos/lists` | List distinct list names |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Sign in, receive session token |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Get current user from token |
| GET | `/agent/context` | Agent-readable DB summary |
| GET | `/agent/schema` | Semantic vocabulary + write envelope |

---

## Agent Integration

- `agent-data-service.js` centralizes all frontend API calls — use it instead of raw `fetch` in HTML pages
- Write operations accept optional `idempotencyKey` and `audit` fields (see `docs/agent-contract.md`)
- Destructive operations (DELETE) require `?confirm=true`
- Auth endpoints exist but writes are not yet token-gated (Phase 7 in progress — see `docs/prd.md`)

---

## Build Phases (summary — see `docs/prd.md` for detail)

| Phase | Name | Status |
|-------|------|--------|
| 0 | Context Layer | ✅ Done |
| 1 | Semantic Layer | ✅ Done |
| 2 | Slash Command Agents | ✅ Done |
| 3 | Shopping API Migration | ✅ Done |
| 4 | Idempotency & Audit Trail | ✅ Done |
| 5 | Simple AI Meal Planner | ✅ Done |
| 6 | Extended AI Planner UI | 🔶 In Progress |
| 7 | Multi-User Auth | 🔶 In Progress |
| 8 | Google Calendar Integration | 🔲 Future |
| 9 | MCP Server Integration | 🔲 Future |
| 10 | Calendar & Todos | ✅ Done |
| 11 | Expiration-Aware AI Planning | 🔲 Future |
| 12 | Smart Home Dashboard | 🔲 Future |

---

## Copilot Behavior

When generating code for this project, Copilot should:

- Follow existing patterns in `Program.cs` before introducing new ones
- Respect the one-file API rule — add endpoints inline, not in new files
- Use Dapper with parameterized queries for all SQL
- Match the existing error response shape: `{ "error": "message" }`
- Never add auth middleware to routes until Phase 7 is explicitly implemented
- Prefer editing existing files over creating new ones
- Keep functions small and intent obvious — avoid clever tricks