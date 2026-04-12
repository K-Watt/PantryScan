# Agent Readiness Checklist

## No-regression checks (current app)
- [x] `planner.html` still allows drag-drop planning in month/week views.
- [x] `planner.html` writes to SQL and refreshes from API on reload.
- [x] Existing planner data in localStorage migrates once via `/meal-plans/bulk`.
- [x] `recipes.html` still supports add recipe modal + filtering/sorting.
- [x] `recipes.html` writes to SQL and refreshes from API on reload.
- [x] Existing recipes in localStorage migrate once via `/recipes/bulk`.
- [x] `shopping.html` migrates localStorage to API on boot; SQL is now source of truth.
- [x] `GET /agent/context` reflects recipe, planner, shopping, calendar, and todo counts.

## Backend checks
- [x] `dotnet build api/PantryScan.Api/PantryScan.Api.csproj` passes.
- [x] API starts and listens on configured URL (http://localhost:5169).
- [x] `GET /meal-plans`, `POST /meal-plans`, `PUT /meal-plans/note`, `DELETE /meal-plans` work.
- [x] `GET /recipes`, `POST /recipes`, `POST /recipes/bulk` work.
- [x] `GET /shopping`, `POST /shopping/items`, `PUT /shopping/items/{id}/check`, `DELETE /shopping/items/{id}`, `DELETE /shopping/checked` work.
- [x] `GET /calendar`, `POST /calendar`, `PUT /calendar/{id}`, `DELETE /calendar/{id}` work.
- [x] `GET /todos`, `POST /todos`, `PUT /todos/{id}`, `PUT /todos/{id}/complete`, `DELETE /todos/{id}`, `GET /todos/lists` work.
- [x] `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` work.

## Completed agent-readiness milestones
- [x] All write endpoints accept optional `idempotencyKey` — duplicates return `{ idempotent: true }`.
- [x] `dbo.AuditLog` records every write: method, endpoint, actor, outcome, timestamp.
- [x] Every `DELETE` requires `?confirm=true` — omitting returns `400`.
- [x] Shopping moved to SQL/API — no longer localStorage-only.
- [x] `agent-data-service.js` centralizes all frontend API calls.

## In Progress (PRD Phase 6 + 7)
- [ ] Extended planner UI: date range picker wired up.
- [ ] Extended planner UI: full filter panel (cuisine, tags, cook time, servings) functional.
- [ ] AI uses active filter state when generating draft plans.
- [ ] Write endpoints enforce `X-Session-Token` — auth is gated, not optional.
- [ ] All family members provisioned with their own login.

## Before Real Agent Runtime (future phases)
- [ ] Google Calendar OAuth + overlay on planner (PRD Phase 8).
- [ ] MCP server built and connected to Claude Code (PRD Phase 9).
- [ ] Add contract/integration tests for all agent-facing endpoints.
