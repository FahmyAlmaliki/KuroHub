# 🖤 KuroHub — IoT Dashboard Platform

> Platform IoT modern dengan dashboard yang bisa dikustomisasi sepenuhnya — tambahkan widget, atur ukuran, drag & drop, dan kendalikan perangkat ESP32 via Virtual Pin.

---

## 📂 Dokumen Brief

| File | Cakupan | Untuk Siapa |
|------|---------|-------------|
| `README.md` | Overview, visi, quick start | Semua anggota tim |
| `BRIEF_01_ARCHITECTURE.md` | Arsitektur sistem, database schema, virtual pin model | Tech Lead |
| `BRIEF_02_BACKEND.md` | REST API, WebSocket protocol, virtual pin engine | Backend Dev |
| `BRIEF_03_FRONTEND.md` | Widget system, drag & drop grid, komponen UI | Frontend Dev |
| `BRIEF_04_DEVOPS.md` | Docker, Nginx, deployment, env vars | DevOps |
| `BRIEF_05_ESP32_LIBRARY.md` | KuroHub ESP32 library — virtual pin, callback, API | Firmware Dev |

---

## 🎯 Visi Produk

**KuroHub** adalah platform IoT berbasis web yang menggabungkan:

- **Real-time monitoring** — data sensor ESP32 tampil langsung di dashboard
- **Widget-based dashboard** — pengguna bebas menambah, mengatur posisi, dan mengubah ukuran widget
- **Virtual Pin system** — komunikasi dua arah antara dashboard dan ESP32 melalui pin virtual (V0–V255)
- **Drag & Drop layout** — tata letak dashboard sepenuhnya dikustomisasi per pengguna
- **ESP32 Library** — library Arduino resmi `KuroHub.h` untuk koneksi mudah ke platform

**Inspirasi:** Blynk · Grafana · Node-RED · ThingsBoard

---

## 🧩 Widget yang Didukung

| Widget | Virtual Pin | Arah Data | Keterangan |
|--------|------------|-----------|------------|
| **Value Display** | Vx (read) | ESP32 → Dashboard | Tampilkan nilai sensor |
| **Line Chart** | Vx (read) | ESP32 → Dashboard | Grafik historis & real-time |
| **Area Chart** | Vx (read) | ESP32 → Dashboard | Variasi grafik dengan fill |
| **Gauge** | Vx (read) | ESP32 → Dashboard | Indikator circular |
| **Button** | Vx (write) | Dashboard → ESP32 | Kirim nilai 0/1 saat diklik |
| **Toggle Switch** | Vx (write) | Dashboard → ESP32 | ON/OFF persistent |
| **Slider** | Vx (write) | Dashboard → ESP32 | Kirim nilai numerik (range) |
| **Color Picker** | Vx (write) | Dashboard → ESP32 | Kirim nilai warna (hex/rgb) |
| **Terminal** | Vx (read/write) | Dua arah | Log teks dari/ke ESP32 |
| **LED Indicator** | Vx (read) | ESP32 → Dashboard | Indikator status on/off |
| **Map** | Vx (read) | ESP32 → Dashboard | Tampilkan GPS coordinate |
| **Label** | — | — | Teks statis, dekorasi |

---

## 🧰 Technology Stack

### Frontend
- React 18 + Vite + TypeScript
- TailwindCSS + shadcn/ui
- **react-grid-layout** — drag & drop + resize grid system
- React Router v6 + TanStack Query + Zustand
- Recharts — chart widgets

### Backend
- Node.js + Express + TypeScript
- **ws** — WebSocket server (port terpisah untuk device & dashboard)
- JWT (access + refresh token)
- Zod — validasi input
- Winston — logging

### Database
- **PostgreSQL** — users, devices, widget layouts, virtual pin config, alerts
- **InfluxDB v2** — time-series telemetry dari virtual pin

### ESP32 Library
- **KuroHub.h** — Arduino library (C++)
- Komunikasi via WebSocket + JSON
- API mirip Blynk: `KUROHUB_WRITE(V1)`, `KuroHub.virtualWrite(V5, value)`

### DevOps
- Docker + Docker Compose
- Nginx — reverse proxy + SSL

---

## 🗂️ Folder Structure

```
kurohub/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── widgets/            # Semua widget components
│   │   │   │   ├── base/           # WidgetWrapper, WidgetMenu
│   │   │   │   ├── display/        # ValueDisplay, LED, Terminal
│   │   │   │   ├── chart/          # LineChart, AreaChart, Gauge
│   │   │   │   └── control/        # Button, Toggle, Slider, ColorPicker
│   │   │   ├── grid/               # DashboardGrid, GridToolbar
│   │   │   └── layout/             # Sidebar, Topbar, AppLayout
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   └── types/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── devices/
│   │   │   ├── widgets/            # Widget CRUD + layout management
│   │   │   ├── virtualpin/         # Virtual pin read/write/history
│   │   │   └── alerts/
│   │   ├── ws/
│   │   │   ├── deviceHandler.ts    # Tangani ESP32
│   │   │   ├── dashboardHandler.ts # Tangani browser
│   │   │   └── pinBroker.ts        # Route pin data antara ESP32 ↔ dashboard
│   │   └── ...
│   └── ...
│
├── esp32-library/                  # KuroHub Arduino Library
│   ├── src/
│   │   ├── KuroHub.h
│   │   ├── KuroHub.cpp
│   │   └── KuroHubPin.h
│   ├── examples/
│   │   ├── BasicConnect/
│   │   ├── VirtualPinRead/
│   │   ├── VirtualPinWrite/
│   │   └── ButtonControl/
│   ├── library.properties
│   └── README.md
│
├── nginx/
├── docker/
├── docs/
└── README.md
```

---

## 🚀 Quick Start (Development)

```bash
git clone https://github.com/yourname/kurohub.git
cd kurohub

# Copy env
cp .env.example .env

# Jalankan database
docker compose up postgres influxdb -d

# Backend
cd backend && npm install && npm run migrate && npm run dev

# Frontend (terminal baru)
cd frontend && npm install && npm run dev
```

Buka: `http://localhost:5173`

---

## 📋 MVP Scope (v1.0)

### Wajib Ada
- [x] Auth (register, login, JWT)
- [x] Device management + API key generator
- [x] Virtual Pin system (V0–V255)
- [x] Widget: Value Display, Line Chart, Gauge, Button, Toggle, Slider
- [x] Drag & drop dashboard grid
- [x] Resize widget secara manual
- [x] Simpan layout per device per user
- [x] Real-time data via WebSocket
- [x] Historical data chart (InfluxDB)
- [x] Alert rules (threshold on virtual pin)
- [x] KuroHub ESP32 Library (.h + .cpp)
- [x] Contoh kode Arduino
- [x] Dark / light mode
- [x] Docker deployment

### Tidak di v1.0 (Future)
- [ ] Widget Map (GPS)
- [ ] Color Picker widget
- [ ] Terminal widget
- [ ] MQTT support
- [ ] OTA firmware
- [ ] Multi-user organization / role management
- [ ] Mobile app
- [ ] Push notification (email, Telegram)
