# 🦒Praynr / github-pages

The official OSRS Community Toolbox. Create, manage, and share customizable Bingo boards, simulate Mage Runs, and more.

- **Frontend**: [pattyrich.github.io/github-pages](https://pattyrich.github.io/github-pages/)
- **Frontend also at**: [praynr.com](https://praynr.com)
- **API**: [praynr.com](https://praynr.com)

---

## 📡 Technology Stack

- **OS**: Ubuntu 24.04 LTS (Noble Numbat)
- **Backend**: Python 3.13 (Flask + uWSGI)
- **Frontend**: React 18 (pinned for compatibility)
- **Database**: MongoDB 7.0
- **Cache/Task Queue**: Redis 7 + RQ worker
- **Reverse Proxy**: Nginx (with Cloudflare optimization)
- **Monitoring**: Dozzle (real-time log viewer)
- **Infrastructure**: AWS Lightsail + Docker Compose

---

## 🛠️ Setup & Development

### 1. Frontend
```bash
npm i && npm start
```

### 2. Backend Environment (`server/.env`)
Create `server/.env` with the following variables:
```env
FEEDBACK_WEBHOOK=...
CREATION_WEBHOOK=...
DEBUG_WEBHOOK=...
RIOT_API_KEY=...
MONGO_URI=mongodb://mongo:27017/
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
DOZZLE_PASSWORD=... (not needed here I just put it for my own memory)
DOZZLE_USERNAME=... (same as above)
```

### 3. Monitoring (Dozzle)
Generate a bcrypt hash for `data/users.yml`:
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode().replace('\$2b\$', '\$2a\$'))"
```
or just use https://bcrypt-generator.com/

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

## 🔄 CI/CD Pipeline

- **Frontend**: Deployed to `gh-pages` via manual command `npm run deploy`.
- **Frontend & Backend (Production)**: Automatically built and deployed to AWS Lightsail (`praynr.com`) via GitHub Actions on push to `main`.
  - Requires `LIGHTSAIL_HOST`, `LIGHTSAIL_USER`, and `LIGHTSAIL_KEY` secrets.

---

## 💾 Maintenance & Backups

### Maintenance Mode
Toggle maintenance mode for Bingo and LoL-Beat routes in `src/index.js` via the `IS_MAINTENANCE` boolean. This displays a premium styled maintenance screen to users.

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
