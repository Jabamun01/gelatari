# Gelatari — Docker Deployment

This guide explains how to run Gelatari using Docker.

## Prerequisites

- Docker and Docker Compose installed on your machine
- A MongoDB dump from your previous deployment (if migrating data)

## Quick Start (Fresh Setup)

```bash
# Build and start all services
docker compose up -d

# Check that everything is running
docker compose ps

# Access the app at http://localhost
```

## Migrating Data From Old VM

If you have an existing MongoDB dump from your old deployment:

```bash
# 1. Start the services
docker compose up -d

# 2. Wait for MongoDB to be healthy (check with: docker compose ps)

# 3. Restore your database
./scripts/restore-mongo.sh /path/to/your/mongodump

# 4. Verify the data
docker exec gelatari-mongo mongosh iceCreamWorkshop --eval "db.recipes.countDocuments()"
docker exec gelatari-mongo mongosh iceCreamWorkshop --eval "db.ingredients.countDocuments()"
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop and delete the MongoDB volume (**deletes data!**) |
| `docker compose logs -f` | Follow logs from all services |
| `docker compose logs -f backend` | Follow backend logs only |
| `docker compose exec backend sh` | Open a shell in the backend container |
| `docker compose exec mongo mongosh iceCreamWorkshop` | Open MongoDB shell |

## Architecture

```
                         ┌──────────────────┐
                         │  nginx (port 80)  │
                         │  (frontend)       │
                         └──────┬───────────┘
                                │ /api/*
                                ▼
                         ┌──────────────────┐
                         │  backend:3000     │
                         │  (Node.js/Express)│
                         └──────┬───────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  mongo:27017      │
                         │  (MongoDB 7)      │
                         │  volume: mongo_data│
                         └──────────────────┘
```

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend listening port |
| `NODE_ENV` | `production` | Node environment |
| `DATABASE_URI` | `mongodb://mongo:27017/iceCreamWorkshop` | MongoDB connection string |

### Frontend (build-time)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | API base URL (proxied by nginx) |
