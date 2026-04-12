# Product Requirements Document — PantryScan Family Hub

## Overview

PantryScan is a private, family-facing web app for managing the home kitchen and shared household life. It covers pantry inventory, recipes, meal planning, grocery list generation, a shared calendar, and to-do lists. Each family member gets their own login.

---

## Problem

Managing a household kitchen is chaotic:
- You don't know what you have, so you buy duplicates and forget what you need.
- Meals don't get planned, leading to last-minute decisions and food waste.
- Shopping trips are inefficient — no shared list, no sense of what's stocked.
- Family members have no shared visibility into what's happening in the household.

---

## Goals

1. Any family member can check the pantry from their phone in under 10 seconds.
2. Meal planning for the week takes under 5 minutes and produces a ready-to-use grocery list.
3. No family member shows up at the store without the shared shopping list.
4. Food waste decreases because expiring items surface before they go bad.
5. All family members have their own login.

---

## Non-Goals

- Not a nutrition tracker.

---

## Users

| User | Role | Needs |
|------|------|-------|
| **Kodi** | Owner / builder | Full access, admin tools |
| **Family members** | Members | Simple read/write access to pantry, planner, shopping |

Multiple households are supported. Each household is a self-contained group with its own members, recipes, pantry, and plans.

---

## What's Built

- **Pantry inventory** — full CRUD, barcode scanning support
- **Recipes** — full CRUD, bulk import, course/cuisine/tag filtering
- **Meal planner** — week/month views, drag-drop, AI-assisted plan generation via slash commands
- **Shopping list** — SQL-backed, shared, check/uncheck, bulk add, grocery list generation from meal plans
- **Calendar** — month-view grid, full CRUD
- **To-do lists** — priorities, due dates, multiple named lists
- **Auth endpoints** — register, login, logout, session tokens (not yet enforced on writes)
- **AI slash commands** — `/pantry-status`, `/suggest-recipe`, `/add-recipe`, `/grocery-list`, `/plan-week`, `/plan-and-shop`, `/calendar`, `/todos`, `/pantry-write`
- **Idempotency & audit trail** — all write endpoints accept idempotency keys, audit log table

## Planned Features (Gap Analysis)

Features approved for addition, ordered by theme:

### Recipes — Rich Editing
- **Image import** — attach an image to a recipe from a URL or file upload
- **Video URL import** — link a YouTube/video URL to a recipe for step-by-step reference
- **Raw JSON recipe editor** — power-user escape hatch to edit recipe data directly as JSON
- **Custom key/value pairs** — arbitrary metadata on recipes (e.g. "source: Grandma", "last made: 2024-01")
- **Recipe actions** — configurable per-recipe actions (e.g. send to shopping list, open in planner)
- **Migrations** — one-time import from Tandoor, Nextcloud Cookbook, Paprika, Chowdown, Plan to Eat, Recipe Keeper, Copy Me That, My Recipe Box, DVO Cook'n X3

### Organization
- **Cookbooks** — named recipe collections (e.g. "Weeknight Dinners", "Kid Favorites")
- **Fuzzy recipe search** — tolerates typos and partial matches; smart keyword search
- **Canonical foods + units database** — normalized ingredient names and units to prevent duplicates ("1 cup" vs "1 c"), with seed/merge tooling

### Meal Planning
- **Planner rules** — configurable constraints for AI/random plan generation (no repeats within N days, rotate cuisines, prefer low-cook-time on weekdays, etc.)

### Notifications
- **Notifiers** — push or email alerts for expiring pantry items, low-stock items, and upcoming meal plan gaps
- **Webhooks** — outbound HTTP hooks on events (meal plan updated, shopping list changed, etc.)

### Platform
- **Progressive Web App (PWA)** — installable on phone home screen, service worker for fast load; directly serves the "under 10 seconds from phone" goal
- **Customizable color themes** — per-household or per-user color theme selection
- **OpenAPI / interactive API docs** — auto-generated Swagger UI served at `/swagger`
- **Automated backups** — scheduled database exports to a configurable destination (local path or remote)

### Multi-Household
- **Groups / Households** — multiple self-contained household groups, each with their own members, recipes, pantry, and plans; Kodi's household remains the default

---

## Frontend Migration Status

The legacy vanilla HTML frontend has been retired. The React frontend (`ui-react/`) is now the primary UI. 

**Pages implemented:**
- Pantry, Recipes, Planner, Shopping, Barcode Scanner, Login, Register

**Pages TODO (API ready, UI not started):**
- Calendar — month-view grid, full CRUD (API exists)
- To-do lists — priorities, due dates, multiple lists (API exists)

---

## Next Steps

### Finish auth gating
Auth endpoints exist but writes aren't token-gated yet. Each family member needs a provisioned login, and write endpoints need to enforce `X-Session-Token`.

### Planner filter panel
The sidebar filter button exists but isn't wired up. Needs: cuisine, tags, cook time, and servings filters that constrain AI plan generation.

### Complete React UI
Build Calendar and Todos pages in `ui-react/src/pages/` to reach feature parity with the API.

See **Planned Features** section above for the longer-horizon roadmap.

---

## Open Questions

- **Barcode scanning:** Does this integrate with pantry inventory fully, or stay standalone?
- **Walmart integration:** Search links only, or real cart/order API?
- **Mobile UX:** Is the current layout usable on a phone, or does it need a responsive pass?
- **React migration:** `ui-react/` exists as a scaffold. When does it become the real frontend?

---

## Technical Architecture

| Concern | Choice | Why |
|---------|--------|-----|
| Backend | .NET 10 minimal API | Fast to write, strongly typed |
| ORM | Dapper | Lightweight, parameterized SQL |
| Database | SQL Server (local) | Familiar, good tooling |
| Frontend | React + TypeScript + Vite | Modern SPA in `ui-react/` |
| AI | Claude Code + slash commands | Agent logic in `.claude/commands/` |
| API design | REST + JSON | Simple, debuggable |
