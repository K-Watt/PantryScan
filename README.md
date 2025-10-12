# PantryScan Project

PantryScan is a local web + SQL database project used for learning full-stack development and database management.  
It includes a simple HTML front-end and a SQL Server–backed database, all version-controlled in Azure DevOps.

---

## 🧩 Project Structure
| Folder | Description |
|--------|--------------|
| `/db` | SQL Database Project (`PantryScanDB`) with schema and publish profiles |
| `/db/publish` | `.publish.xml` files — define where to deploy (`local`, `test`) |
| `/db/PantryScanDB/dbo` | `.sql` files for tables, views, and stored procedures |
| `/html` or root files | Your web front-end (HTML, CSS, JS) |
| `.gitignore` | Keeps build and temp files out of Git |

---

## ⚙️ Requirements
- **SQL Server 2022 Developer Edition**
- **.NET SDK 8.x**
- **VS Code** with extensions:
  - SQL Server (mssql)
  - SQL Database Projects
  - Live Preview (for HTML)

---

## 🚀 Quick Start

### 1️⃣ Clone & Open
```bash
git clone <your-repo-url>
cd PantryScan
code .
