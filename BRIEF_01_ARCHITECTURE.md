# 📐 BRIEF 01 — Arsitektur Sistem KuroHub

---

## 1. Gambaran Arsitektur

```
Browser (React)
   │  REST API /api/*          WebSocket /ws (dashboard)
   │                                    │
   ▼                                    ▼
┌──────────────────────────────────────────────────────────┐
│                        Nginx :80/:443                    │
└────────────┬────────────────────────────────┬────────────┘
             │                                │
   ┌─────────▼─────────┐          ┌──────────▼──────────┐
   │  Backend REST API  │          │  Backend WS Server   │
   │  Express :3000     │          │  ws :3001            │
   │                    │          │                      │
   │  - Auth            │◄────────►│  - pinBroker         │
   │  - Device CRUD     │          │  - deviceHandler     │
   │  - Widget layout   │          │  - dashboardHandler  │
   │  - Virtual pin API │          │                      │
   └────────┬───────────┘          └──────────┬───────────┘
            │                                 │
     ┌──────▼──────┐                          │ WebSocket /device
     │  PostgreSQL  │               ┌──────────▼──────────┐
     │  :5432       │               │     ESP32 Devices    │
     │              │               │  (KuroHub.h library) │
     │  - users     │               └─────────────────────┘
     │  - devices   │
     │  - widgets   │       ┌──────────────┐
     │  - pin_cfg   │       │   InfluxDB   │
     │  - layouts   │       │   :8086      │
     │  - alerts    │       │              │
     └──────────────┘       │  - telemetry │
                            │    per pin   │
                            └──────────────┘
```

---

## 2. Virtual Pin — Konsep Inti

Virtual Pin adalah **channel komunikasi bernama** antara ESP32 dan dashboard. Tidak ada pin fisik — semuanya virtual.

```
Virtual Pin V0  →  suhu (ESP32 kirim nilai → dashboard tampilkan)
Virtual Pin V1  →  kelembapan
Virtual Pin V5  →  LED relay (dashboard kirim 0/1 → ESP32 eksekusi)
Virtual Pin V10 →  slider kecepatan motor (dashboard kirim 0–255 → ESP32)
```

### Properti Virtual Pin

| Properti | Tipe | Keterangan |
|----------|------|------------|
| `pin_number` | 0–255 | Nomor pin virtual |
| `device_id` | UUID | Milik device mana |
| `label` | string | Nama tampilan: "Suhu Ruangan" |
| `direction` | `read` \| `write` \| `readwrite` | Arah data |
| `data_type` | `number` \| `string` \| `color` | Tipe nilai |
| `unit` | string | Satuan: "°C", "%", "rpm" |
| `min_value` | number | Untuk slider/gauge |
| `max_value` | number | Untuk slider/gauge |
| `last_value` | string | Nilai terakhir yang diterima |
| `last_updated` | timestamp | Kapan terakhir diupdate |

### Alur Data Virtual Pin

```
// ESP32 → Dashboard (direction: read)
ESP32.virtualWrite(V0, 28.5)
  → WS: { type: "pin_write", pin: 0, value: "28.5" }
  → Backend pinBroker:
      1. Update last_value di PostgreSQL
      2. Write ke InfluxDB (pin=V0, value=28.5)
      3. Broadcast ke dashboard subscriber

// Dashboard → ESP32 (direction: write)
User klik Button widget (V5)
  → WS: { type: "pin_write", pin: 5, value: "1" }
  → Backend pinBroker:
      1. Validasi device ownership
      2. Forward ke ESP32 connection
      3. ESP32 terima via KUROHUB_WRITE(V5) callback
```

---

## 3. Widget Layout System

Setiap pengguna memiliki **layout tersendiri per device**. Layout disimpan di PostgreSQL sebagai JSON.

### Konsep Grid

Menggunakan sistem grid berbasis kolom (default: 12 kolom). Setiap widget memiliki posisi dan ukuran dalam satuan grid unit.

```
┌─────────────────────────────────────────────────────────┐
│  col: 0   2   4   6   8   10  12                       │
│  ┌─────────────┐ ┌─────┐ ┌─────────────────────────┐  │
│  │ Line Chart  │ │Gauge│ │    Value Display         │  │
│  │ x:0 y:0     │ │x:6  │ │  x:8 y:0 w:4 h:2        │  │
│  │ w:6 h:4     │ │y:0  │ └─────────────────────────┘  │
│  │             │ │w:2  │ ┌─────────────────────────┐  │
│  │             │ │h:4  │ │    Button  x:8 y:2      │  │
│  └─────────────┘ └─────┘ └─────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Slider   x:0 y:4 w:12 h:2                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Widget Size Constraints

| Widget | Min W | Min H | Default W | Default H |
|--------|-------|-------|-----------|-----------|
| Value Display | 2 | 2 | 3 | 2 |
| Line Chart | 4 | 3 | 6 | 4 |
| Area Chart | 4 | 3 | 6 | 4 |
| Gauge | 2 | 2 | 3 | 3 |
| Button | 2 | 2 | 2 | 2 |
| Toggle Switch | 2 | 2 | 3 | 2 |
| Slider | 3 | 2 | 6 | 2 |
| LED Indicator | 1 | 1 | 2 | 2 |
| Terminal | 4 | 3 | 6 | 4 |
| Label | 1 | 1 | 3 | 1 |

---

## 4. PostgreSQL Schema

### Table: `users`
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(100) NOT NULL,
  timezone    VARCHAR(50) DEFAULT 'UTC',
  theme       VARCHAR(10) DEFAULT 'system',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(512) UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `devices`
```sql
CREATE TABLE devices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  location         VARCHAR(255),
  group_name       VARCHAR(100),
  firmware_version VARCHAR(50),
  api_key          VARCHAR(64) UNIQUE NOT NULL,
  status           VARCHAR(10) DEFAULT 'offline',
  last_seen        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_devices_user    ON devices(user_id);
CREATE INDEX idx_devices_api_key ON devices(api_key);
```

### Table: `virtual_pins`
```sql
CREATE TABLE virtual_pins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  pin_number   SMALLINT NOT NULL CHECK (pin_number >= 0 AND pin_number <= 255),
  label        VARCHAR(100) NOT NULL DEFAULT '',
  direction    VARCHAR(10) NOT NULL DEFAULT 'read',  -- 'read' | 'write' | 'readwrite'
  data_type    VARCHAR(10) NOT NULL DEFAULT 'number', -- 'number' | 'string' | 'color'
  unit         VARCHAR(20) DEFAULT '',
  min_value    DECIMAL(12,4) DEFAULT 0,
  max_value    DECIMAL(12,4) DEFAULT 1023,
  last_value   TEXT,
  last_updated TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (device_id, pin_number)
);
CREATE INDEX idx_vpin_device ON virtual_pins(device_id);
```

### Table: `widgets`
```sql
CREATE TABLE widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(30) NOT NULL,  -- 'value_display' | 'line_chart' | 'button' | dll
  pin_number   SMALLINT REFERENCES virtual_pins(pin_number),
  label        VARCHAR(100) DEFAULT '',
  config       JSONB NOT NULL DEFAULT '{}',  -- konfigurasi khusus per widget type
  -- Grid layout
  grid_x       SMALLINT NOT NULL DEFAULT 0,
  grid_y       SMALLINT NOT NULL DEFAULT 0,
  grid_w       SMALLINT NOT NULL DEFAULT 3,
  grid_h       SMALLINT NOT NULL DEFAULT 2,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_widgets_device ON widgets(device_id);
CREATE INDEX idx_widgets_user   ON widgets(user_id);
```

Kolom `config` JSONB menyimpan konfigurasi spesifik per tipe widget:

```json
// Button widget config
{ "onValue": "1", "offValue": "0", "color": "#6366f1", "mode": "push" }

// Slider widget config
{ "min": 0, "max": 255, "step": 1, "color": "#6366f1" }

// Chart widget config
{ "timeRange": "1h", "color": "#6366f1", "fillOpacity": 0.2, "showDots": false }

// Gauge widget config
{ "min": 0, "max": 100, "warningThreshold": 70, "dangerThreshold": 90, "unit": "%" }

// Value Display config
{ "precision": 1, "fontSize": "xl", "color": "#6366f1", "showTrend": true }
```

### Table: `alert_rules`
```sql
CREATE TABLE alert_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_number   SMALLINT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  operator     VARCHAR(5) NOT NULL,   -- '>' | '<' | '>=' | '<=' | '='
  threshold    DECIMAL(12,4) NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `alert_history`
```sql
CREATE TABLE alert_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  device_id    UUID NOT NULL,
  pin_number   SMALLINT NOT NULL,
  value        DECIMAL(12,4) NOT NULL,
  message      TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alert_history_device ON alert_history(device_id);
```

---

## 5. InfluxDB Schema

```
Organization : kurohub
Bucket       : telemetry
Retention    : 30 hari (configurable)

Measurement  : pin_data
Tags         : device_id (string), pin_number (string), user_id (string)
Fields       : value_num (float, untuk data_type=number)
               value_str (string, untuk data_type=string)
Timestamp    : nanosecond (server-side)
```

**Contoh write:**
```
pin_data,device_id=uuid-xxx,pin_number=V0,user_id=uuid-yyy value_num=28.5
pin_data,device_id=uuid-xxx,pin_number=V3,user_id=uuid-yyy value_str="Hello"
```

**Flux query — historical pin V0, last 1 jam:**
```flux
from(bucket: "telemetry")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "pin_data")
  |> filter(fn: (r) => r.device_id == "uuid-xxx")
  |> filter(fn: (r) => r.pin_number == "V0")
  |> filter(fn: (r) => r._field == "value_num")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
```

---

## 6. Environment Variables

```env
# ─── App ───────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
WS_PORT=3001
FRONTEND_URL=http://localhost:5173
APP_NAME=KuroHub

# ─── JWT ───────────────────────────────────────────────────
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-different-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ─── PostgreSQL ────────────────────────────────────────────
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=kurohub
POSTGRES_USER=kurohub_user
POSTGRES_PASSWORD=your-password

# ─── InfluxDB ──────────────────────────────────────────────
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your-influx-token
INFLUX_ORG=kurohub
INFLUX_BUCKET=telemetry
INFLUX_ADMIN_USER=admin
INFLUX_ADMIN_PASSWORD=your-influx-admin-pass

# ─── Security ──────────────────────────────────────────────
BCRYPT_ROUNDS=12
COOKIE_SECRET=your-cookie-secret
LOG_LEVEL=info
```

---

## 7. Architecture Decision Records (ADR)

| # | Keputusan | Alasan |
|---|-----------|--------|
| ADR-01 | Virtual pin sebagai abstraksi komunikasi | Memisahkan logika bisnis dari protokol transport; fleksibel untuk MQTT di masa depan |
| ADR-02 | Layout disimpan di PostgreSQL (bukan localStorage) | Layout persisten lintas device dan browser; multi-device sync |
| ADR-03 | Widget config dalam JSONB satu kolom | Fleksibel untuk tambah tipe widget baru tanpa migration SQL; query cukup lewat widget_id |
| ADR-04 | pinBroker sebagai single point routing | Semua logika routing pin ada di satu tempat; mudah di-trace dan di-debug |
| ADR-05 | Grid 12 kolom (react-grid-layout) | Standar industri; row height dikunci 80px untuk konsistensi visual |
| ADR-06 | Pin number V0–V255 as string di InfluxDB | Lebih mudah di-filter dan lebih readable di query Flux |
