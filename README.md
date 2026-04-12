# PantryScan Project

PantryScan is a private family web hub — pantry inventory, recipes, meal planning, grocery lists, a shared calendar, and to-do lists. It also serves as a hands-on learning environment for AI agent development.

For full product details see `docs/prd.md`. For coding conventions see `CLAUDE.md`.

---

## 🧩 Project Structure
| Folder / File | Description |
|---------------|-------------|
| `api/PantryScan.Api/` | .NET 10 minimal API — all endpoints in `Program.cs` |
| `db/PantryScanDB/` | SQL schema files (one `.sql` per table) |
| `docs/` | PRD, agent contracts, semantic layer, readiness tracker |
| `ui-react/` | Planned React/TypeScript/Vite frontend (exploratory) |
| `.claude/commands/` | Claude Code slash command agent prompts |
| `*.html` (root) | Vanilla HTML frontend pages — open directly in browser |
| `agent-data-service.js` | Centralized frontend API adapter |

---

## ⚙️ Requirements
- **SQL Server 2022 Developer Edition**
- **.NET SDK 10.x**
- **VS Code** with extensions:
  - SQL Server (mssql)
  - SQL Database Projects
  - C# Dev Kit

---

## 🚀 Quick Start

### 1️⃣ Clone & Open
```bash
git clone <your-repo-url>
cd PantryScan
code .
```

### 2️⃣ Start the API
```bash
cd api/PantryScan.Api
dotnet run
# Listens on http://localhost:5169
```

### 3️⃣ Open the UI
Open any `.html` file at the repo root directly in a browser — no dev server needed.
