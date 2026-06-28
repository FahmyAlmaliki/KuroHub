# KuroHub — AI Coding Agent Instructions

## Project Identity
Nama project: **KuroHub**
Deskripsi: Self-hosted IoT dashboard platform dengan widget drag & drop dan Virtual Pin system untuk ESP32.
Stack: React + Vite + TypeScript (frontend), Node.js + Express + WebSocket (backend), PostgreSQL + InfluxDB (database), Docker + Nginx (deployment).

## Dokumentasi Referensi
Sebelum menulis kode apapun, baca file brief yang tersedia di root project:
- `README.md` — overview dan MVP scope
- `BRIEF_01_ARCHITECTURE.md` — arsitektur, database schema, virtual pin model
- `BRIEF_02_BACKEND.md` — REST API spec lengkap, WebSocket protocol, pinBroker
- `BRIEF_03_FRONTEND.md` — widget system, drag & drop grid, komponen
- `BRIEF_04_DEVOPS.md` — Docker, Nginx, env vars
- `BRIEF_05_ESP32_LIBRARY.md` — KuroHub.h library untuk ESP32

## Core Concepts yang Wajib Dipahami

### Virtual Pin
- Virtual Pin (V0–V255) adalah abstraksi komunikasi antara ESP32 dan dashboard
- `direction: read` = ESP32 → Dashboard (sensor data)
- `direction: write` = Dashboard → ESP32 (button, slider, toggle)
- `direction: readwrite` = dua arah (terminal)
- Semua data pin disimpan di InfluxDB measurement `pin_data` dengan tag `device_id`, `pin_number`

### Widget System
- Setiap widget terhubung ke satu virtual pin
- Layout disimpan di PostgreSQL kolom `widgets.grid_x/y/w/h`
- Konfigurasi spesifik widget disimpan di `widgets.config` (JSONB)
- Grid menggunakan `react-grid-layout` dengan 12 kolom, row height 80px
- Edit mode: widget bisa drag & resize. View mode: widget control aktif

### WebSocket
- Port 3001 — dua endpoint berbeda:
  - `/ws/device` untuk ESP32 (auth via api_key)
  - `/ws/dashboard` untuk browser (auth via JWT)
- `pinBroker.ts` adalah single point routing semua pin data

## Aturan Penulisan Kode

### Umum
- Gunakan TypeScript strict mode di semua file `.ts` dan `.tsx`
- Ikuti folder structure yang sudah didefinisikan di setiap brief
- Jangan buat file di luar struktur yang sudah ditentukan tanpa alasan jelas
- Setiap fungsi penting wajib ada JSDoc comment minimal satu baris
- Gunakan named export, bukan default export (kecuali untuk page components di React)

### Backend
- Semua route handler harus pakai async/await, bukan callback
- Validasi input dengan Zod schema sebelum proses bisnis
- Error selalu di-throw ke global error handler, bukan di-handle inline
- Format response selalu: `{ success: true, data: {...} }` atau `{ success: false, error: {...} }`
- Pisahkan: routes → controller → service → db query

### Frontend
- State server (API data) pakai TanStack Query
- State client (UI) pakai Zustand
- Live pin data dari WebSocket masuk ke `pinStore`, bukan TanStack Query
- Komponen widget harus bisa render bahkan saat data belum ada (skeleton/loading state)
- Semua widget props harus punya TypeScript interface yang eksplisit

### Database
- PostgreSQL: gunakan parameterized query (`$1, $2`), jangan string interpolation
- InfluxDB: write non-blocking (jangan await di hot path WebSocket handler)
- Setiap migration SQL diberi nomor urut: `001_xxx.sql`, `002_xxx.sql`

### ESP32 Library
- API harus tetap simpel seperti Blynk: `KuroHub.virtualWrite(V0, value)`
- Callback menggunakan macro `KUROHUB_WRITE(Vx) { ... }`
- Library harus non-blocking — tidak ada `delay()` di internal library
- Semua fungsi publik harus terdokumentasi di header file

## Urutan Pengerjaan yang Disarankan

1. Setup PostgreSQL migrations (`001` hingga `005`)
2. Backend: auth module (register, login, JWT middleware)
3. Backend: device module (CRUD + API key generator)
4. Backend: virtual pin module (CRUD + InfluxDB write/read)
5. Backend: WebSocket server (deviceHandler + dashboardHandler + pinBroker)
6. Backend: widget module (CRUD + batch layout save)
7. Frontend: auth pages (login, register)
8. Frontend: AppLayout + routing
9. Frontend: WebSocket hook + pinStore
10. Frontend: DevicesPage (list + add device)
11. Frontend: DeviceDetailPage + DashboardGrid
12. Frontend: widget components satu per satu (mulai dari ValueDisplay, Button, Toggle)
13. Frontend: chart widgets (LineChart, AreaChart, Gauge)
14. Frontend: SliderWidget
15. Frontend: WidgetPickerModal + WidgetConfigModal
16. ESP32 Library: KuroHub.h + KuroHub.cpp
17. Docker + Nginx config
18. Testing end-to-end

## Ketika Membuat File Baru

Selalu tanya dulu:
1. Apakah file ini sudah didefinisikan di brief? Jika ya, ikuti nama dan lokasi yang sudah ada.
2. Apakah logika ini seharusnya di service layer, bukan controller?
3. Apakah TypeScript type-nya sudah ada di `types/index.ts`?

## Hal yang DILARANG

- Jangan gunakan `any` di TypeScript kecuali benar-benar tidak ada alternatif
- Jangan simpan access token di localStorage (gunakan Zustand memory store)
- Jangan await InfluxDB write di dalam WebSocket message handler (non-blocking)
- Jangan pakai `delay()` di `loop()` ESP32 saat KuroHub.run() aktif
- Jangan hardcode host/port/secret di kode — semua dari environment variable
- Jangan buat endpoint REST baru yang tidak ada di BRIEF_02_BACKEND.md tanpa konfirmasi

## Wajib: Tulis History Setiap Selesai Mengerjakan Sesuatu

Setiap kali menyelesaikan satu task (membuat file, mengedit file, fix bug, dll),
WAJIB append ke file `HISTORY.md` di root project.

Format entry:

[YYYY-MM-DD HH:MM] — <judul singkat task>
Status: ✅ Selesai | ⚠️ Partial | 🔧 Fix
File yang dibuat/diubah:

path/ke/file.ts — dibuat — deskripsi singkat isi file
path/ke/file2.ts — diubah — apa yang berubah
path/ke/file3.sql — dihapus — alasan
