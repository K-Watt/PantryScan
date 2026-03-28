# PantryScan — Family Hub

## What this is
A home-made family web hub. Starting as a kitchen pantry tracker, growing into a full family platform: recipes, meal planning, shared calendar, to-do lists, pantry inventory with barcode scanning, and grocery list generation (Walmart-integrated). Each family member gets their own login.

## Tech Stack
- **Backend:** .NET 10 minimal API (ASP.NET Core), Dapper ORM
- **Database:** SQL Server — `PantryScanDB` on `localhost,1433`
  - User: `sa` / Password: `PantryScanP@ss1`
- **Frontend:** Static HTML/CSS/JavaScript (no build step, no framework)
- **Barcode scanning:** JS library via `barcode_scanner_page.html`

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

curl http://localhost:5169/agent/context
# → JSON with entity counts and capabilities
```

### Open the UI
Open any `.html` file directly in a browser — no dev server needed.
- `index.html` — Pantry inventory
- `recipes.html` — Recipe list
- `planner.html` — Meal planner
- `shopping.html` — Shopping list
- `barcode_scanner_page.html` — Barcode scan
- `login.html` — Auth (Phase 3+)

## Folder Map
```
PantryScan/
├── api/PantryScan.Api/
│   └── Program.cs          ← ALL API endpoints live here (minimal API)
├── db/PantryScanDB/
│   └── dbo.*.sql           ← SQL schema files (one per table)
├── docs/
│   ├── agent-contract.md   ← REST request/response contracts for agents
│   ├── agent-readiness.md  ← Migration phase tracker
│   └── semantic-layer.md   ← Domain entity vocabulary (Phase 1+)
├── ui/
│   ├── styles.css
│   └── theme.css
├── .claude/
│   ├── settings.local.json ← Allowed bash commands + hooks
│   └── commands/           ← /project:* slash command prompts (Phase 2+)
├── agent-data-service.js   ← Frontend API adapter (centralized fetch calls)
└── CLAUDE.md               ← This file
```

## API Surface (current)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/items` | List all pantry items |
| POST | `/items` | Add a pantry item `{ name, quantity }` |
| PUT | `/items/{id}` | Update item `{ quantity }` |
| DELETE | `/items/{id}` | Remove item |
| GET | `/recipes` | List all recipes |
| POST | `/recipes` | Create recipe (see agent-contract.md) |
| PUT | `/recipes/{id}` | Update recipe |
| DELETE | `/recipes/{id}` | Delete recipe |
| POST | `/recipes/bulk` | Bulk create/migrate recipes |
| GET | `/meal-plans` | Get meal plan entries `?from=&to=` |
| POST | `/meal-plans` | Create/upsert meal plan entry |
| POST | `/meal-plans/bulk` | Bulk upsert entries |
| DELETE | `/meal-plans` | Delete entry by date+mealType |
| PUT | `/meal-plans/note` | Upsert a day note |
| GET | `/shopping` | List shopping items |
| POST | `/shopping` | Add shopping item |
| DELETE | `/shopping/{id}` | Remove shopping item |
| GET | `/agent/context` | Agent-readable summary of DB state |
| GET | `/agent/schema` | Semantic vocabulary (Phase 1+) |

## Agent Integration
- **agent-contract.md** defines the JSON envelopes for all write operations
- Write operations accept optional `idempotencyKey` and `audit` fields
- Agent-safe reads: any GET endpoint
- Destructive operations: DELETE — confirm before calling
- The `agent-data-service.js` adapter centralizes all frontend API calls

## Coding Rules
- All endpoints in `Program.cs` — do not split into controllers until the file exceeds ~1200 lines
- New SQL tables go in `db/PantryScanDB/dbo.TableName.sql`
- Input validation: always check required fields, trim strings, reject negative quantities
- Return `{ error: "message" }` on 400/404; never throw unhandled exceptions to clients
- No auth middleware yet — planned for Phase 3
- SQL: use parameterized queries only (Dapper handles this)

## Current Build Phase
See `docs/agent-readiness.md` for phase tracker.
- Phase 0 (Context layer): done
- Phase 1 (Semantic layer): in progress
- Phase 2 (.prompt slash commands): pending
- Phase 3 (Multi-user auth): pending
- Phase 4 (Agent workflows + shopping API): pending
- Phase 5 (Calendar + Todos): pending
- Phase 6 (Hooks + automations): pending
