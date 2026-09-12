# Self-hosted deployment

Runs PantryScan as three containers — Postgres, the .NET API, and the React UI
behind nginx. Works on `linux/arm64` (Raspberry Pi 5) and `amd64`.

## Quick start

```bash
cd deploy
cp .env.example .env        # set PG_PASSWORD and PGDATA_DIR
docker compose up -d --build
```

- UI:  http://<host>:8080
- API: http://<host>:5169

The API creates its own database and schema on first start (`EnsureDatabaseAsync`
/ `EnsureSchemaAsync`), so there is no migration step to run.

## Why PostgreSQL and not SQL Server

The dev setup in `start.sh` uses Azure SQL Edge via Colima on macOS. That does not
work on a Raspberry Pi 5:

- SQL Server publishes **no arm64 image** at all.
- Azure SQL Edge *does* ship arm64, but **cannot start on the Pi 5** — its bundled
  jemalloc requires 4 KB memory pages and the Pi 5's `2712` kernel uses 16 KB
  (`<jemalloc>: Unsupported system page size`). Forcing `kernel=kernel8.img` would
  work but changes the whole machine.
- Azure SQL Edge is also being retired by Microsoft.

So the data layer targets PostgreSQL. Behaviour is unchanged; only the SQL dialect
differs.

## Postgres gotcha worth knowing

Postgres folds unquoted identifiers to **lowercase**. Column aliases that the UI
reads by name are therefore explicitly double-quoted in `Program.cs`:

```sql
SELECT LowStockThreshold AS "lowStockThreshold"
```

Without the quotes the API still returns HTTP 200 and the UI silently renders
blank fields. **Do not remove those quotes.**

## On a btrfs host

Disable copy-on-write on the Postgres data directory *before* first use, or the
database will fragment badly:

```bash
sudo mkdir -p /path/to/pgdata && sudo chattr +C /path/to/pgdata
```

## Auto-deploy

`deploy/sync.sh` polls `origin/main`, and rebuilds and restarts only when the
commit changes. It builds before swapping, so a broken commit leaves the running
version untouched. Install it with the bundled systemd timer.

## Installing the auto-deploy timer

```bash
sudo cp deploy/pantryscan-sync.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pantryscan-sync.timer
```

Check what it has done:

```bash
sudo tail -f /var/log/pantryscan-deploy.log
systemctl list-timers pantryscan-sync.timer
```

Force a deploy without waiting for the next poll:

```bash
sudo systemctl start pantryscan-sync.service
```
