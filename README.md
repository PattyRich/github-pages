# Praynr / github-pages

Frontend hosted at https://pattyrich.github.io/github-pages/  
API hosted at https://praynr.com

## Stack
- React frontend (gh-pages hosted)
- Flask + uWSGI API
- MongoDB
- Redis + RQ worker
- Nginx reverse proxy
- Docker (dev/prod)

---

## Setup

### Frontend
```bash
npm i && npm start
```

### Server `.env`
Create `server/.env` with the following:
```
FEEDBACK_WEBHOOK=
CREATION_WEBHOOK=
DEBUG_WEBHOOK=
RIOT_API_KEY=
MONGO_URI=mongodb://mongo:27017/
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
DOZZLE_PASSWORD= (don't need to actually fill here I just put it here to remember what it is)
DOZZLE_USERNAME=
```

### Dozzle `data/users.yml`
Generate a bcrypt hash of your password, then create `data/users.yml`:
```yaml
users:
  admin:
    name: YourName
    password: $2a$12$yourbcrypthashhere
    email: you@example.com
```
To generate the hash:
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode().replace('\$2b\$', '\$2a\$'))"
```
or just use https://bcrypt-generator.com/

---

## Docker

### Dev
```bash
# Start
docker compose up -d

# Stop
docker compose down

# Rebuild after code changes (api should hot reload idk about worker)
docker compose up -d --build api worker

# Logs
docker compose logs -f api
docker compose logs -f worker
```

### Prod
```bash
# Start
docker compose -f docker-compose.prod.yml up -d

# Stop (keeps data)
docker compose -f docker-compose.prod.yml down

# Rebuild after code changes
docker compose -f docker-compose.prod.yml up -d --build --no-deps api worker

# Logs (or use Dozzle at :8080)
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
```

> ⚠️ Never use `docker compose down -v` in prod — it deletes your MongoDB and Redis volumes.

---

## Deploy

### Frontend
```bash
npm run deploy
```
Builds React and pushes to gh-pages branch.

### Server
Automatically deployed via GitHub Actions on push to `main`. Requires these secrets set in the repo:
- `LIGHTSAIL_HOST` — server IP
- `LIGHTSAIL_USER` — user
- `LIGHTSAIL_KEY` — contents of `.pem` file

---

## Mongo Data

Production data lives in a Docker named volume at `/var/lib/docker/volumes/github-pages_mongo_data/_data`.

To back up:
```bash
mongodump --out ~/mongo-backup
docker cp ~/mongo-backup $(docker compose -f docker-compose.prod.yml ps -q mongo):/tmp/mongo-backup
docker exec $(docker compose -f docker-compose.prod.yml ps -q mongo) mongorestore /tmp/mongo-backup
```
