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
- **Docker** (PostgreSQL runs in a container — `brew install colima docker` on macOS)
- **.NET SDK 10.x**
- **Node 22.x** (for the UI)
- **VS Code** with the **C# Dev Kit** extension

> The data layer targets **PostgreSQL**, not SQL Server. See
> [`deploy/README.md`](deploy/README.md) for why, and for self-hosting.
> The `db/PantryScanDB/*.sql` files are the legacy SQL Server schema project and
> are no longer what the app creates — `EnsureSchemaAsync` in `Program.cs` is
> authoritative and builds the schema on first run.

---

## 🚀 Quick Start

### ⭐ One command (recommended)
From the repo root:
```bash
./start.sh          # or, from anywhere: pantryscan
```
This boots PostgreSQL (in Colima), the .NET API, and the React UI, then opens the app in your browser. Press **Ctrl+C** to stop the API and UI — PostgreSQL keeps running in the background. First run requires Colima (`brew install colima docker`).

---

### Manual steps

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
