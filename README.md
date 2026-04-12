# PantryScan Project

PantryScan is a private family web hub — pantry inventory, recipes, meal planning, grocery lists, a shared calendar, and to-do lists. It also serves as a hands-on learning environment for AI agent development.

For full product details see `docs/prd.md`. For coding conventions see `CLAUDE.md`.

---

## 🧩 Project Structure
| Folder / File | Description |
|---------------|-------------|
| `api/PantryScan.Api/` | .NET 10 minimal API — all endpoints in `Program.cs` |
| `api/PantryScan.Tests/` | Unit + integration tests |
| `db/PantryScanDB/` | SQL schema files (one `.sql` per table) |
| `db/seeds/` | Seed data scripts |
| `docs/` | PRD and documentation |
| `ui-react/` | React/TypeScript/Vite frontend |
| `.claude/commands/` | Claude Code slash command agent prompts |

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

### 3️⃣ Start the Frontend
```bash
cd ui-react
npm run dev
# Opens on http://localhost:5173
```
