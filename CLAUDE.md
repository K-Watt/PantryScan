# PantryScan — Family Hub

## What this is
A family web app for managing the kitchen and household: pantry inventory, recipes, meal planning, shopping lists, shared calendar, and to-do lists. Each family member gets their own login.

## Tech Stack
- **Backend:** .NET 10 minimal API (ASP.NET Core), Dapper ORM
- **Database:** SQL Server — `PantryScanDB` on `localhost,1433`
  - User: `sa` / Password: `PantryScanP@ss1`
- **Frontend:** React + TypeScript + Vite (`ui-react/`)

## How to Run

### Start the API
```bash
cd api/PantryScan.Api
dotnet run
# Listens on http://localhost:5169
```

### Verify it's working
```bash
curl http://localhost:5169/
# → "PantryScan API running"
```

### Start the Frontend
```bash
cd ui-react
npm run dev
# Opens on http://localhost:5173
```

## Folder Map
```
PantryScan/
├── api/PantryScan.Api/
│   └── Program.cs          ← ALL API endpoints live here (minimal API)
├── api/PantryScan.Tests/   ← Unit + integration tests
├── db/PantryScanDB/
│   └── dbo.*.sql           ← SQL schema files (one per table)
├── db/seeds/               ← Seed data scripts
├── docs/
│   └── prd.md              ← Source of truth for product decisions
├── ui-react/               ← React/TS/Vite frontend
│   └── src/
│       ├── pages/          ← Page components (Pantry, Recipes, Planner, etc.)
│       ├── components/     ← Shared components
│       └── services/       ← API client
├── .claude/
│   ├── settings.local.json ← Allowed bash commands + hooks
│   └── commands/           ← Slash command prompts
└── CLAUDE.md               ← This file
```

## API Surface

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/items` | List all pantry items |
| POST | `/items` | Add a pantry item `{ name, quantity }` |
| PUT | `/items/{id}` | Update item `{ quantity }` |
| DELETE | `/items/{id}` | Remove item |
| GET | `/recipes` | List all recipes |
| POST | `/recipes` | Create recipe |
| PUT | `/recipes/{id}` | Update recipe |
| DELETE | `/recipes/{id}` | Delete recipe |
| POST | `/recipes/bulk` | Bulk create/migrate recipes |
| GET | `/meal-plans` | Get meal plan entries `?from=&to=` |
| POST | `/meal-plans` | Create/upsert meal plan entry |
| POST | `/meal-plans/bulk` | Bulk upsert entries |
| DELETE | `/meal-plans` | Delete entry by date+mealType |
| PUT | `/meal-plans/note` | Upsert a day note |
| GET | `/shopping` | List shopping items |
| POST | `/shopping/items` | Add shopping item |
| PUT | `/shopping/items/{clientId}/check` | Check/uncheck item |
| DELETE | `/shopping/items/{clientId}` | Remove item |
| DELETE | `/shopping/checked` | Clear all checked items |
| POST | `/shopping/bulk` | Bulk add items |
| GET | `/calendar` | List calendar events `?from=&to=` |
| POST | `/calendar` | Create event |
| PUT | `/calendar/{id}` | Update event |
| DELETE | `/calendar/{id}` | Delete event |
| GET | `/todos` | List todos `?list=&completed=` |
| POST | `/todos` | Create todo |
| PUT | `/todos/{id}` | Update todo |
| PUT | `/todos/{id}/complete` | Toggle complete |
| DELETE | `/todos/{id}` | Delete todo |
| GET | `/todos/lists` | List distinct list names |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Sign in, receive session token |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Get current user from token |
| GET | `/agent/context` | Summary of DB state |

## Coding Rules
- All endpoints in `Program.cs` — do not split into controllers until the file exceeds ~1200 lines
- New SQL tables go in `db/PantryScanDB/dbo.TableName.sql`
- Input validation: always check required fields, trim strings, reject negative quantities
- Return `{ error: "message" }` on 400/404; never throw unhandled exceptions to clients
- Auth endpoints exist but writes are not token-gated yet
- SQL: use parameterized queries only (Dapper handles this)
- Write operations accept optional `idempotencyKey` — duplicates return `{ idempotent: true }`
- All DELETEs require `?confirm=true`

## What's Next
- **Auth gating:** Enforce `X-Session-Token` on write endpoints, provision family logins
- **Planner filters:** Wire up the sidebar filter panel (cuisine, tags, cook time, servings)
