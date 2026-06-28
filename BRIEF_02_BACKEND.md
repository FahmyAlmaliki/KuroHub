# ⚙️ BRIEF 02 — Backend Developer Guide

---

## 1. Struktur Folder Backend

```
backend/
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── logger.ts
│   ├── db/
│   │   ├── postgres.ts
│   │   ├── influx.ts
│   │   └── migrations/
│   │       ├── 001_users.sql
│   │       ├── 002_devices.sql
│   │       ├── 003_virtual_pins.sql
│   │       ├── 004_widgets.sql
│   │       └── 005_alerts.sql
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimiter.ts
│   │   ├── validate.ts
│   │   └── errorHandler.ts
│   ├── api/
│   │   ├── auth/
│   │   ├── devices/
│   │   ├── virtualpin/
│   │   │   ├── virtualpin.routes.ts
│   │   │   ├── virtualpin.controller.ts
│   │   │   ├── virtualpin.service.ts
│   │   │   └── virtualpin.schema.ts
│   │   ├── widgets/
│   │   │   ├── widgets.routes.ts
│   │   │   ├── widgets.controller.ts
│   │   │   ├── widgets.service.ts
│   │   │   └── widgets.schema.ts
│   │   └── alerts/
│   ├── ws/
│   │   ├── wsServer.ts
│   │   ├── deviceHandler.ts
│   │   ├── dashboardHandler.ts
│   │   └── pinBroker.ts           ← INTI dari sistem virtual pin
│   ├── services/
│   │   └── alertEngine.ts
│   └── types/
│       └── index.ts
└── ...
```

---

## 2. REST API Specification

### Base URL
```
Development : http://localhost:3000/api
Production  : https://yourdomain.com/api
```

### Response Format
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "DEVICE_NOT_FOUND", "message": "..." } }
```

---

### 🔐 Auth Endpoints

#### `POST /api/auth/register`
```json
// Body
{ "name": "Fahmy", "email": "fahmy@example.com", "password": "Min8Char!" }

// Response 201
{ "success": true, "data": { "user": { ... }, "accessToken": "eyJ...", "refreshToken": "64hex..." } }
```

#### `POST /api/auth/login`
```json
// Body
{ "email": "fahmy@example.com", "password": "Min8Char!" }
```

#### `POST /api/auth/refresh`
Kirim via httpOnly cookie. Response: `{ "accessToken": "eyJ..." }`

#### `POST /api/auth/logout`
Hapus refresh token dari DB.

#### `GET /api/auth/me`
#### `PUT /api/auth/me`
#### `PUT /api/auth/me/password`

---

### 📡 Device Endpoints

Semua butuh `Authorization: Bearer <token>`.

#### `GET /api/devices`
```json
// Response 200
{
  "success": true,
  "data": {
    "devices": [{
      "id": "uuid",
      "name": "ESP32 Greenhouse",
      "status": "online",
      "lastSeen": "2024-01-15T10:30:00Z",
      "pinCount": 5,
      "widgetCount": 8
    }]
  }
}
```

#### `POST /api/devices`
```json
// Body
{ "name": "ESP32 Greenhouse", "description": "...", "location": "...", "groupName": "..." }

// Response 201
{ "data": { "device": { ... }, "apiKey": "kurohub_64hexchars..." } }
```

#### `GET /api/devices/:id`
#### `PUT /api/devices/:id`
#### `DELETE /api/devices/:id`
#### `POST /api/devices/:id/regenerate-key`

---

### 📌 Virtual Pin Endpoints

#### `GET /api/devices/:deviceId/pins`
Ambil semua virtual pin device.

```json
// Response 200
{
  "success": true,
  "data": {
    "pins": [{
      "id": "uuid",
      "pinNumber": 0,
      "label": "Suhu Ruangan",
      "direction": "read",
      "dataType": "number",
      "unit": "°C",
      "minValue": -20,
      "maxValue": 80,
      "lastValue": "28.5",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }]
  }
}
```

#### `POST /api/devices/:deviceId/pins`
Buat atau update virtual pin (upsert by pin_number).

```json
// Body
{
  "pinNumber": 0,
  "label": "Suhu Ruangan",
  "direction": "read",
  "dataType": "number",
  "unit": "°C",
  "minValue": -20,
  "maxValue": 80
}
```

#### `PUT /api/devices/:deviceId/pins/:pinNumber`
Update konfigurasi pin.

#### `DELETE /api/devices/:deviceId/pins/:pinNumber`
Hapus pin beserta data historisnya.

#### `GET /api/devices/:deviceId/pins/:pinNumber/history`
Query data historis pin.

```
Query params:
  from        ISO8601  required
  to          ISO8601  default: now
  resolution  string   default: 5m  (1m | 5m | 15m | 1h | 1d)
  fn          string   default: mean (mean | max | min | last)
```

```json
// Response 200
{
  "success": true,
  "data": {
    "pinNumber": 0,
    "field": "value_num",
    "points": [
      { "timestamp": "2024-01-15T00:00:00Z", "value": 27.2 },
      { "timestamp": "2024-01-15T00:05:00Z", "value": 27.8 }
    ]
  }
}
```

#### `GET /api/devices/:deviceId/pins/:pinNumber/latest`
Nilai terbaru satu pin.

```json
// Response 200
{ "data": { "pinNumber": 0, "value": "28.5", "updatedAt": "..." } }
```

#### `POST /api/devices/:deviceId/pins/:pinNumber/write`
Tulis nilai ke pin dari REST (misalnya otomasi eksternal). Backend akan forward ke ESP32 via WS.

```json
// Body
{ "value": "1" }
```

#### `GET /api/devices/:deviceId/pins/export`
Export semua pin data ke CSV/JSON.

```
Query params: from, to, format (csv|json), pins (comma-sep pin numbers)
```

---

### 🧩 Widget Endpoints

#### `GET /api/devices/:deviceId/widgets`
Ambil semua widget beserta layout.

```json
// Response 200
{
  "success": true,
  "data": {
    "widgets": [{
      "id": "uuid",
      "type": "line_chart",
      "pinNumber": 0,
      "label": "Grafik Suhu",
      "config": { "timeRange": "1h", "color": "#6366f1" },
      "layout": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }]
  }
}
```

#### `POST /api/devices/:deviceId/widgets`
Tambah widget baru.

```json
// Body
{
  "type": "button",
  "pinNumber": 5,
  "label": "Relay 1",
  "config": { "onValue": "1", "offValue": "0", "color": "#ef4444", "mode": "push" },
  "layout": { "x": 6, "y": 0, "w": 2, "h": 2 }
}
```

#### `PUT /api/devices/:deviceId/widgets/:widgetId`
Update widget config atau label.

#### `DELETE /api/devices/:deviceId/widgets/:widgetId`

#### `PUT /api/devices/:deviceId/widgets/layout`
**Endpoint khusus untuk save layout setelah drag & drop / resize.**
Menerima array semua widget dengan posisi terbaru sekaligus (batch update).

```json
// Body
{
  "layouts": [
    { "widgetId": "uuid-1", "x": 0, "y": 0, "w": 6, "h": 4 },
    { "widgetId": "uuid-2", "x": 6, "y": 0, "w": 3, "h": 3 },
    { "widgetId": "uuid-3", "x": 9, "y": 0, "w": 3, "h": 2 }
  ]
}

// Response 200
{ "success": true, "data": { "updated": 3 } }
```

> Layout di-save otomatis setiap kali user selesai drag atau resize (debounce 500ms di frontend).

---

### 🔔 Alert Endpoints

#### `GET /api/alerts`
#### `POST /api/alerts`
```json
// Body
{
  "deviceId": "uuid",
  "pinNumber": 0,
  "name": "Suhu Terlalu Tinggi",
  "operator": ">",
  "threshold": 35.0
}
```
#### `PUT /api/alerts/:id`
#### `DELETE /api/alerts/:id`
#### `PATCH /api/alerts/:id/toggle`
#### `GET /api/alerts/history`

---

## 3. WebSocket Protocol (Port 3001)

### Dua jenis client

```
ws://host:3001/device     → ESP32 (auth via api_key)
ws://host:3001/dashboard  → Browser (auth via JWT)
```

---

### A. ESP32 Device Client (`/device`)

#### Auth (pesan pertama, wajib)
```json
// Kirim
{ "type": "auth", "api_key": "kurohub_64hexchars..." }

// Response sukses
{ "type": "auth_ok", "device_id": "uuid", "name": "ESP32 Greenhouse" }

// Response gagal → server close connection
{ "type": "auth_error", "message": "API key tidak valid" }
```

#### ESP32 → Dashboard: Kirim nilai pin (virtualWrite)
```json
{ "type": "pin_write", "pin": 0, "value": "28.5" }
```

Backend akan:
1. Validasi pin ownership
2. Update `virtual_pins.last_value` di PostgreSQL
3. Write ke InfluxDB (`pin_data` measurement)
4. Evaluasi alert rules untuk pin ini
5. Broadcast ke semua dashboard subscriber device ini

#### Dashboard → ESP32: Terima nilai pin
```json
// ESP32 terima ini ketika dashboard user geser slider / klik button
{ "type": "pin_update", "pin": 5, "value": "1" }
```

#### Heartbeat
```json
{ "type": "ping" }   // dari ESP32
{ "type": "pong" }   // dari server
```

---

### B. Dashboard Browser Client (`/dashboard`)

#### Auth (pesan pertama)
```json
{ "type": "auth", "token": "eyJ..." }
{ "type": "auth_ok", "user_id": "uuid" }
```

#### Subscribe ke device
```json
{ "type": "subscribe", "device_id": "uuid" }
{ "type": "subscribed", "device_id": "uuid" }
```

#### Terima update pin dari ESP32 (real-time)
```json
{
  "type": "pin_update",
  "device_id": "uuid",
  "pin": 0,
  "value": "28.5",
  "timestamp": 1720000000
}
```

#### Dashboard kirim nilai ke ESP32 (button/slider/toggle)
```json
{ "type": "pin_write", "device_id": "uuid", "pin": 5, "value": "1" }
```

Backend forward langsung ke koneksi WS ESP32 yang bersangkutan.

#### Terima update status device
```json
{
  "type": "device_status",
  "device_id": "uuid",
  "status": "offline",
  "last_seen": "2024-01-15T10:30:00Z"
}
```

#### Terima notifikasi alert
```json
{
  "type": "alert_triggered",
  "rule_id": "uuid",
  "device_id": "uuid",
  "pin": 0,
  "value": 36.2,
  "threshold": 35.0,
  "operator": ">",
  "message": "Suhu Terlalu Tinggi: V0 (36.2°C) > 35.0°C"
}
```

---

## 4. pinBroker — Inti Routing Virtual Pin

```typescript
// ws/pinBroker.ts

// Map: device_id → WebSocket koneksi ESP32
const deviceConnections = new Map<string, WebSocket>();

// Map: device_id → Set of dashboard WebSocket yang subscribe
const dashboardSubscribers = new Map<string, Set<WebSocket>>();

export async function handlePinFromDevice(
  deviceId: string,
  pin: number,
  value: string
) {
  // 1. Update PostgreSQL
  await updatePinLastValue(deviceId, pin, value);

  // 2. Write ke InfluxDB (non-blocking)
  writePinToInflux(deviceId, pin, value).catch(logger.error);

  // 3. Evaluasi alert rules
  await alertEngine.evaluate(deviceId, pin, parseFloat(value));

  // 4. Broadcast ke dashboard subscribers
  const subscribers = dashboardSubscribers.get(deviceId) ?? new Set();
  const msg = JSON.stringify({
    type: 'pin_update',
    device_id: deviceId,
    pin,
    value,
    timestamp: Math.floor(Date.now() / 1000),
  });

  for (const ws of subscribers) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

export async function handlePinFromDashboard(
  userId: string,
  deviceId: string,
  pin: number,
  value: string
) {
  // Validasi ownership
  const device = await getDeviceByIdAndUser(deviceId, userId);
  if (!device) return;

  // Forward ke ESP32
  const deviceWs = deviceConnections.get(deviceId);
  if (deviceWs?.readyState === WebSocket.OPEN) {
    deviceWs.send(JSON.stringify({ type: 'pin_update', pin, value }));
  }

  // Simpan last_value meski ESP32 offline (untuk state persistence)
  await updatePinLastValue(deviceId, pin, value);
}
```

---

## 5. Alert Engine

```typescript
// services/alertEngine.ts
export async function evaluate(deviceId: string, pin: number, value: number) {
  const rules = await getActiveRulesForPin(deviceId, pin);

  for (const rule of rules) {
    if (!checkCondition(value, rule.operator, rule.threshold)) continue;

    await saveAlertHistory(rule, value);

    // Broadcast ke dashboard
    const msg = {
      type: 'alert_triggered',
      rule_id: rule.id,
      device_id: deviceId,
      pin,
      value,
      threshold: rule.threshold,
      operator: rule.operator,
      message: `${rule.name}: V${pin} (${value}) ${rule.operator} ${rule.threshold}`,
    };
    broadcastToDeviceSubscribers(deviceId, msg);
  }
}
```

---

## 6. Dependencies Backend

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.16.0",
    "@influxdata/influxdb-client": "^1.33.0",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.0"
  }
}
```
