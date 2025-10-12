# PantryScanDB — SQL Database Project

This folder contains the database schema and deployment profiles for the PantryScan system.

---

## 🔧 Build
To compile the SQL project into a `.dacpac` (database package):

1. In VS Code, open the **Database Projects** view.
2. Right-click **PantryScanDB** → **Build**.
3. Confirm **Build succeeded** in the Output panel.

---

## 🚀 Publish
To deploy schema changes to SQL Server:

### Local Development
- Profile: `publish/local.publish.xml`
- Target DB: `PantryScanDB`

### Test Environment
- Profile: `publish/test.publish.xml`
- Target DB: `PantryScanDB_Test`

**Steps:**
1. Right-click **PantryScanDB** → **Publish**.
2. Choose **Browse for profile** and select the XML file.
3. Wait for “Deployment completed successfully.”

---

## 🧠 Notes
- The `/db/PantryScanDB/dbo` folder contains `.sql` files for each table and view.
- `.publish.xml` files define where to deploy and how.
- Avoid setting `DropObjectsNotInSource=True` unless you want to remove missing objects.

---

## 🗂 Version Control
- Always **build → publish → commit → push** after making schema changes.
- Ignore `bin/`, `obj/`, and `.dacpac` files.
