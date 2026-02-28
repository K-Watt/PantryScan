# Agent Readiness - PantryScan

## Scope
This document describes current architecture and migration status to prepare PantryScan for a future AI agent runtime. It does **not** define LLM orchestration logic.

## Current Architecture (February 2026)
- Frontend: static HTML pages (`index.html`, `planner.html`, `recipes.html`, `shopping.html`).
- Backend: .NET 8 minimal API (`api/PantryScan.Api/Program.cs`) with SQL Server storage via Dapper.
- Database: `dbo.Items`, `dbo.Recipes`, `dbo.MealPlanEntries`.

## Data Ownership
- Inventory: SQL/API source of truth (`/items`).
- Planner: SQL/API source of truth (`/meal-plans` + note/bulk/delete endpoints).
- Recipes: SQL/API source of truth (`/recipes` + bulk endpoint).
- Shopping: localStorage source of truth (`pantryscan_shopping`) for now.
- Local caches (planner/recipes) are retained for compatibility and migration fallback.

## Migration Phases
1. **Phase 1 (done)**: Add SQL tables and endpoints for planner/recipes.
2. **Phase 2 (done)**: Migrate local planner/recipes on page boot using bulk endpoints.
3. **Phase 3 (done)**: Introduce shared `agent-data-service.js` adapter used by planner/recipes and shopping local helpers.
4. **Phase 4 (next)**: Move shopping to API-backed storage and expose agent-safe shopping contracts.
5. **Phase 5 (next)**: Add explicit idempotency/audit handling and policy enforcement at API level.

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
- Define and enforce idempotency headers/keys in API handlers.
- Persist operation audit records (action id, actor, timestamp, outcome).
- Add shopping API + migration.
- Add confirmation policy for destructive actions.
