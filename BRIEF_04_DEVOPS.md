# 🐳 BRIEF 04 — DevOps & Deployment Guide

---

## 1. Docker Services Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ frontend │  │ backend  │  │ postgres │  │influxdb│  │
│  │ :80      │  │ :3000    │  │ :5432    │  │ :8086  │  │
│  │ (nginx)  │  │ :3001(ws)│  │          │  │        │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │             │             │       │
│       └──────────┬───┘             └──────┬──────┘       │
│                  │                        │              │
│         ┌────────▼──────────┐    docker internal network │
│         │      nginx        │                            │
│         │  :80 (HTTP)       │                            │
│         │  :443 (HTTPS)     │                            │
│         └───────────────────┘                            │
└──────────────────────────────────────────────────────────┘
```

---

## 2. docker-compose.yml

```yaml
# docker/docker-compose.yml
version: '3.9'

services:

  # ─── Nginx ───────────────────────────────────────────────
  nginx:
    image: nginx:1.25-alpine
    container_name: kurohub_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ../nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ../nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - kurohub_net

  # ─── Frontend ────────────────────────────────────────────
  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    container_name: kurohub_frontend
    expose:
      - "80"
    restart: unless-stopped
    networks:
      - kurohub_net

  # ─── Backend ─────────────────────────────────────────────
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    container_name: kurohub_backend
    expose:
      - "3000"
      - "3001"
    env_file:
      - ../.env
    environment:
      NODE_ENV: production
      PORT: 3000
      WS_PORT: 3001
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      INFLUX_URL: http://influxdb:8086
    depends_on:
      postgres:
        condition: service_healthy
      influxdb:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - kurohub_net

  # ─── PostgreSQL ───────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: kurohub_postgres
    expose:
      - "5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../backend/migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - kurohub_net

  # ─── InfluxDB ─────────────────────────────────────────────
  influxdb:
    image: influxdb:2.7-alpine
    container_name: kurohub_influxdb
    expose:
      - "8086"
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: ${INFLUX_ADMIN_USER}
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUX_ADMIN_PASSWORD}
      DOCKER_INFLUXDB_INIT_ORG: ${INFLUX_ORG}
      DOCKER_INFLUXDB_INIT_BUCKET: ${INFLUX_BUCKET}
      DOCKER_INFLUXDB_INIT_RETENTION: 720h
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: ${INFLUX_TOKEN}
    volumes:
      - influxdb_data:/var/lib/influxdb2
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - kurohub_net

networks:
  kurohub_net:
    driver: bridge

volumes:
  postgres_data:
  influxdb_data:
```

---

## 3. Nginx Configuration

```nginx
# nginx/nginx.conf
worker_processes auto;

events { worker_connections 1024; }

http {
  include      mime.types;
  default_type application/octet-stream;
  sendfile     on;
  gzip         on;
  gzip_types   text/plain application/json application/javascript text/css;

  # Rate limit zone
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/m;

  upstream backend_rest { server backend:3000; }
  upstream backend_ws   { server backend:3001; }
  upstream frontend_app { server frontend:80; }

  # HTTP → HTTPS redirect (production)
  server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # ─── REST API ───────────────────────────────────────
    location /api/ {
      proxy_pass       http://backend_rest;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-Proto $scheme;
      limit_req        zone=api_limit burst=20 nodelay;
    }

    # ─── WebSocket dashboard (browser) ──────────────────
    location /ws/dashboard {
      proxy_pass         http://backend_ws;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host $host;
      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }

    # ─── WebSocket device (ESP32) ────────────────────────
    location /ws/device {
      proxy_pass         http://backend_ws;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection "upgrade";
      proxy_set_header   Host $host;
      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }

    # ─── Frontend SPA ────────────────────────────────────
    location / {
      proxy_pass       http://frontend_app;
      proxy_set_header Host $host;
    }
  }
}
```

### nginx.dev.conf (Development — tanpa SSL)

```nginx
server {
  listen 80;
  server_name localhost;

  location /api/    { proxy_pass http://backend:3000; }

  location /ws/ {
    proxy_pass         http://backend:3001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_read_timeout 3600s;
  }

  location / {
    proxy_pass         http://frontend:5173;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
  }
}
```

---

## 4. Dockerfile — Frontend

```dockerfile
# frontend/Dockerfile

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_WS_URL
RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.spa.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location ~* \.(js|css|png|jpg|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## 5. Dockerfile — Backend

```dockerfile
# backend/Dockerfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
EXPOSE 3000 3001
CMD ["node", "dist/index.js"]
```

---

## 6. .env.example (Lengkap)

```env
# ════════════════════════════════════════════════════════
#  KuroHub — Environment Variables
#  Copy ke .env dan isi semua nilai
#  JANGAN commit .env ke repository
# ════════════════════════════════════════════════════════

# ─── App ─────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
WS_PORT=3001
FRONTEND_URL=http://localhost:5173
APP_NAME=KuroHub

# ─── JWT ─────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=GANTI_RANDOM_SECRET_MIN_32_CHAR
JWT_REFRESH_SECRET=GANTI_SECRET_BERBEDA_DARI_ATAS
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ─── PostgreSQL ───────────────────────────────────────────
POSTGRES_HOST=localhost          # 'postgres' jika pakai docker compose
POSTGRES_PORT=5432
POSTGRES_DB=kurohub
POSTGRES_USER=kurohub_user
POSTGRES_PASSWORD=GANTI_PASSWORD_KUAT

# ─── InfluxDB ─────────────────────────────────────────────
INFLUX_URL=http://localhost:8086  # 'http://influxdb:8086' jika docker
INFLUX_TOKEN=GANTI_INFLUX_TOKEN
INFLUX_ORG=kurohub
INFLUX_BUCKET=telemetry
INFLUX_ADMIN_USER=admin
INFLUX_ADMIN_PASSWORD=GANTI_INFLUX_ADMIN_PASSWORD

# ─── Security ─────────────────────────────────────────────
BCRYPT_ROUNDS=12
COOKIE_SECRET=GANTI_COOKIE_SECRET

# ─── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000     # 15 menit
RATE_LIMIT_MAX=100

# ─── Logging ──────────────────────────────────────────────
LOG_LEVEL=info                  # error | warn | info | debug

# ─── Virtual Pin ──────────────────────────────────────────
PIN_MAX_NUMBER=255
DEVICE_OFFLINE_TIMEOUT_MS=60000 # 60 detik tidak ada pesan → offline
WS_TELEMETRY_RATE_LIMIT_MS=1000 # min interval per device (1 detik)
```

---

## 7. Perintah Docker

```bash
# ─── Development ─────────────────────────────────────────

# Jalankan hanya database
docker compose -f docker/docker-compose.yml up postgres influxdb -d

# Build dan jalankan semua
docker compose -f docker/docker-compose.yml up --build

# Lihat log backend
docker compose -f docker/docker-compose.yml logs -f backend

# ─── Production ──────────────────────────────────────────

# Build semua image
docker compose -f docker/docker-compose.yml build

# Deploy
docker compose -f docker/docker-compose.yml up -d

# Update satu service saja (tanpa downtime lain)
docker compose -f docker/docker-compose.yml up -d --no-deps --build backend

# Cek status
docker compose -f docker/docker-compose.yml ps

# ─── Database ────────────────────────────────────────────

# Masuk ke psql
docker exec -it kurohub_postgres psql -U kurohub_user -d kurohub

# Backup PostgreSQL
docker exec kurohub_postgres pg_dump -U kurohub_user kurohub \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup_20240115.sql | docker exec -i kurohub_postgres \
  psql -U kurohub_user -d kurohub

# ─── Cleanup ─────────────────────────────────────────────

# Stop semua (data tetap aman)
docker compose -f docker/docker-compose.yml down

# Hapus semua termasuk data (HATI-HATI)
docker compose -f docker/docker-compose.yml down -v
```

---

## 8. SSL Setup

### Opsi A: Let's Encrypt (Certbot)
```bash
apt install certbot
certbot certonly --standalone -d yourdomain.com

# Mount ke nginx (docker-compose.yml):
volumes:
  - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/certs:ro

# Auto-renew (crontab):
0 0 * * * certbot renew --quiet && docker compose restart nginx
```

### Opsi B: Cloudflare Proxy (Paling Mudah)
1. Arahkan domain ke IP server di Cloudflare
2. Aktifkan proxy (ikon awan orange)
3. Set SSL/TLS mode: **Full (strict)**
4. Nginx cukup listen port 80

### Opsi C: Self-signed (Dev/Testing)
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=localhost"
```

---

## 9. Health Check Endpoints

```typescript
// Backend wajib expose:
GET /api/health        → { status: "ok", uptime: 12345 }
GET /api/health/db     → { postgres: "ok", influx: "ok" }
GET /api/health/ws     → { device_connections: 3, dashboard_connections: 2 }
```

---

## 10. Deployment Checklist

```
Pre-deployment:
□ Semua nilai .env terisi (tidak ada placeholder)
□ JWT secrets di-generate dengan crypto.randomBytes(64)
□ Password PostgreSQL & InfluxDB kuat (min 16 char acak)
□ FRONTEND_URL sesuai domain production
□ NODE_ENV=production
□ SSL certificate tersedia

Build & Deploy:
□ docker compose build → tidak ada error
□ docker compose up -d
□ docker compose ps → semua status "healthy"
□ GET /api/health → 200 ok
□ GET /api/health/db → postgres: ok, influx: ok

Fungsional:
□ Register user baru → berhasil
□ Login → dapat access token
□ Tambah device → dapat API key
□ Hubungkan ESP32 (dengan library KuroHub.h) → status online
□ ESP32 kirim virtualWrite → data muncul di widget real-time
□ Klik button widget → ESP32 terima callback KUROHUB_WRITE
□ Drag widget → posisi tersimpan setelah refresh

Post-deployment:
□ Setup log rotation
□ Setup backup cron PostgreSQL (harian)
□ Setup uptime monitoring (UptimeRobot / Uptime Kuma)
□ Test restore backup
□ Simpan semua credentials di password manager tim
```
