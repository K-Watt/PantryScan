# Agent Readiness Checklist

## No-regression checks (current app)
- [ ] `planner.html` still allows drag-drop planning in month/week views.
- [ ] `planner.html` writes to SQL and refreshes from API on reload.
- [ ] Existing planner data in localStorage migrates once via `/meal-plans/bulk`.
- [ ] `recipes.html` still supports add recipe modal + filtering/sorting.
- [ ] `recipes.html` writes to SQL and refreshes from API on reload.
- [ ] Existing recipes in localStorage migrate once via `/recipes/bulk`.
- [ ] `shopping.html` behavior unchanged; local list persists as before.
- [ ] `GET /agent/context` reflects recipe/planner counts.

## Backend checks
- [ ] `dotnet build api/PantryScan.Api/PantryScan.Api.csproj` passes.
- [ ] API starts and listens on configured URL.
- [ ] `GET /meal-plans`, `POST /meal-plans`, `PUT /meal-plans/note`, `DELETE /meal-plans` work.
- [ ] `GET /recipes`, `POST /recipes`, `POST /recipes/bulk` work.

## Before real agent runtime
- [ ] Add first-class idempotency handling (storage + replay behavior).
- [ ] Persist audit trail for all agent-originated writes.
- [ ] Introduce policy checks/confirmations for destructive operations.
- [ ] Move shopping to API-backed storage.
- [ ] Add auth/identity boundaries for multi-user operation.
- [ ] Add contract/integration tests for all agent-facing endpoints.
