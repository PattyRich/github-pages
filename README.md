# 🦒Praynr / github-pages

The official OSRS Community Toolbox. Create, manage, and share customizable Bingo boards, simulate boss loot, and more.

- **Frontend**: [pattyrich.github.io/github-pages](https://pattyrich.github.io/github-pages/)
- **Main Site**: [praynr.com](https://praynr.com)
- **API**: [praynr.com](https://praynr.com)
- **Monitoring (Dozzle)**: [dozzle.praynr.com](https://dozzle.praynr.com)

---

## 🏗️ Repository Architecture

This project is a monorepo organized for clarity and scale. See [Architecture Documentation](docs/architecture.md) for a deep dive into the system design.

- **`apps/frontend/`**: React 19 + Vite application.
- **`services/api/`**: Python backend + RQ worker + MongoDB.
- **`scripts/`**: Utility scripts and data management.

---

## 🛠️ Quick Start (Local Development)

The project is managed via a root-level `Makefile`.

### 1. Install Everything
```bash
make install
```

### 2. Configure Environment
Create `services/api/.env` with your API keys and configuration (see [services/api/.env.example](services/api/.env.example) for a template).

### 3. Run the Development Environment
This starts the backend (Docker) and frontend (Vite) concurrently with a robust cleanup hook.
```bash
make dev
```

---

## 📡 Technology Stack

- **Frontend**: React 19, Vite, Bootstrap 5
- **Backend**: Python 3.13 (uWSGI + RQ Worker)
- **Database**: MongoDB 7.0
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx (with Cloudflare optimization)
- **Infrastructure**: AWS Lightsail + Docker Compose

---

## 🐳 Docker Management

### Production Deployment
```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop services (keeps data persistent in volumes)
docker compose -f docker-compose.prod.yml down

# Rebuild specific services after code changes
docker compose -f docker-compose.prod.yml up -d --build --no-deps api worker
```

> [!CAUTION]
> **Data Persistence**: Never use `docker compose down -v` in production. It will permanently delete your MongoDB and Redis volumes.

---

## 📊 Monitoring

We use **Dozzle** for real-time monitoring of container logs. This is essential for debugging production issues without needing SSH access.

- **URL**: [dozzle.praynr.com](https://dozzle.praynr.com)
- **Auth**: Secured via simple authentication (see `dozzle/users.yml`).
- **Features**: Live streaming logs, container stats, and log searching.

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for fully automated deployments:

- **Frontend**: Automatically built and deployed to `/var/www/frontend` on `praynr.com`.
- **Backend**: Automatically updated on the AWS Lightsail server via SSH.
- **Maintenance**: Weekly automated container image updates and pruning.

---

## 💾 Maintenance & Backups

### Maintenance Mode
Toggle maintenance mode for Bingo and LoL-Beat routes in `apps/frontend/src/index.jsx` via the `IS_MAINTENANCE` boolean.

### Automated Backups
We use an **SSH Streaming** script to pull daily backups from the server directly to local storage.
- **Script**: `scripts/backup.ps1`
- **Schedule**: Configured via Windows Task Scheduler.
- **Retention**: Automatically keeps only the 5 most recent backups.

To run a manual backup:
```powershell
powershell -ExecutionPolicy Bypass -File "scripts/backup.ps1"
```

---

## 🗃️ Mongo Data Recovery

If you ever need to restore a backup:
```bash
# 1. Copy the archive into the container
docker cp your_backup.gz github-pages-mongo-1:/tmp/backup.gz

# 2. Run the restore command inside the container
docker exec github-pages-mongo-1 mongorestore --archive=/tmp/backup.gz --gzip
```
