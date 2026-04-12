# Agent Readiness - PantryScan

## Scope
This document describes current architecture and migration status to prepare PantryScan for a future AI agent runtime. It does **not** define LLM orchestration logic.

## Current Architecture (April 2026)
- Frontend: static HTML pages (`index.html`, `planner.html`, `recipes.html`, `shopping.html`, `calendar.html`, `todos.html`, `login.html`).
- Backend: .NET 10 minimal API (`api/PantryScan.Api/Program.cs`) with SQL Server storage via Dapper.
- Database: `dbo.Items`, `dbo.Recipes`, `dbo.MealPlanEntries`, `dbo.ShoppingItems`, `dbo.AuditLog`, `dbo.CalendarEvents`, `dbo.Todos`, `dbo.Users`.

## Data Ownership
- Inventory: SQL/API source of truth (`/items`).
- Planner: SQL/API source of truth (`/meal-plans` + note/bulk/delete endpoints).
- Recipes: SQL/API source of truth (`/recipes` + bulk endpoint).
- Shopping: SQL/API source of truth (`/shopping/items`, `/shopping/checked`) — localStorage migration completed (PRD Phase 3 ✅).
- Local caches (planner/recipes) are retained for compatibility and migration fallback.

## Migration Phases
> Phase numbers below correspond to `docs/prd.md` phase numbering.

1. **PRD Phase 1 (done)**: Add SQL tables and endpoints for planner/recipes.
2. **PRD Phase 2 (done)**: Migrate local planner/recipes on page boot using bulk endpoints.
3. **PRD Phase 3 (done)**: Move shopping to API-backed storage; introduce shared `agent-data-service.js` adapter.
4. **PRD Phase 4 (done)**: Add explicit idempotency/audit handling and policy enforcement at API level.
   - Added `dbo.AuditLog` table (auto-created on startup).
   - All write endpoints accept optional `idempotencyKey` and `audit` fields.
   - Duplicate write detection: returns `{ idempotent: true }` on repeated keys.
   - Every write records an audit row with method, endpoint, actor, outcome, and timestamp.
   - `GET /agent/context` now includes `auditLog: { total, last24h }` summary.
   - Added missing `PUT /items/{id}` and `DELETE /items/{id}` endpoints.
   - Added missing `DELETE /recipes/{id}` endpoint.
5. **PRD Phase 5 (done)**: AI Meal Planner slash commands + plan-week / plan-and-shop workflows.
6. **PRD Phase 10 (done)**: Calendar + Todos.
   - Added `dbo.CalendarEvents` and `dbo.Todos` tables (auto-created on startup).
   - Calendar endpoints: `GET /calendar`, `POST /calendar`, `PUT /calendar/{id}`, `DELETE /calendar/{id}`.
   - Todos endpoints: `GET /todos`, `POST /todos`, `PUT /todos/{id}`, `PUT /todos/{id}/complete`, `DELETE /todos/{id}`, `GET /todos/lists`.
   - `GET /agent/context` now includes `calendarEvents`, `todos`, and `openTodos` counts.
   - `agent-data-service.js` extended with `fetchEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `fetchTodos`, `createTodo`, `updateTodo`, `completeTodo`, `deleteTodo`, `fetchTodoLists`.
   - New static pages: `calendar.html` (month-view grid) and `todos.html` (list-based with priorities/due dates).
   - All existing page sidebars updated to include Calendar and Todos navigation links.

## Frontend Adapter
`agent-data-service.js` now provides:
- API adapter: planner + recipes read/write methods.
- Local adapter: recipes, planner, shopping cache helpers.
- Migration flags: `pantryscan_plan_migrated_to_sql_v1`, `pantryscan_recipes_migrated_to_sql_v1`.

This keeps page UX unchanged while centralizing data-access seams for future agent integration.

## Safety and Reversibility
- No new AI runtime dependencies.
- No auth model changes.
- Existing pages maintain current UI and interactions.
- Data migration is additive and retriable; local data remains as fallback cache.

## Remaining Before Real Agent Runtime
- Complete auth token enforcement on write endpoints (PRD Phase 7 🔶 In Progress).
- Complete Extended AI Planner UI filters (PRD Phase 6 🔶 In Progress).
- Future: Google Calendar integration (PRD Phase 8), MCP Server (PRD Phase 9).
