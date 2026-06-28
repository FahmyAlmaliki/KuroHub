# 📟 BRIEF 05 — KuroHub ESP32 Library

> Dokumentasi lengkap library Arduino `KuroHub.h` untuk koneksi ESP32 ke platform KuroHub via Virtual Pin.

---

## 1. Overview Library

**KuroHub.h** adalah Arduino library resmi untuk menghubungkan ESP32 ke platform KuroHub. Desain API terinspirasi dari Blynk, namun berjalan sepenuhnya di server sendiri (self-hosted).

### Fitur Utama
- Koneksi WebSocket otomatis + auto-reconnect
- `virtualWrite(pin, value)` — kirim data ke dashboard
- Callback `KUROHUB_WRITE(Vx)` — terima perintah dari dashboard
- `syncVirtualPin(pin)` — minta nilai terkini dari server
- Support tipe data: `int`, `float`, `double`, `String`
- Non-blocking (berbasis event loop `KuroHub.run()`)
- Debug log via Serial

### Instalasi
```
// Arduino Library Manager:
Cari: "KuroHub"
Install: KuroHub by KuroHub Team

// Manual:
Salin folder esp32-library/src ke:
  Windows: Documents/Arduino/libraries/KuroHub/
  Linux/Mac: ~/Arduino/libraries/KuroHub/
```

---

## 2. Struktur Library

```
esp32-library/
├── src/
│   ├── KuroHub.h           # Header utama
│   ├── KuroHub.cpp         # Implementasi
│   └── KuroHubPin.h        # Virtual pin type definitions
├── examples/
│   ├── 01_BasicConnect/
│   │   └── 01_BasicConnect.ino
│   ├── 02_VirtualPinRead/
│   │   └── 02_VirtualPinRead.ino
│   ├── 03_ButtonControl/
│   │   └── 03_ButtonControl.ino
│   ├── 04_SliderControl/
│   │   └── 04_SliderControl.ino
│   ├── 05_ToggleRelay/
│   │   └── 05_ToggleRelay.ino
│   ├── 06_MultiSensor/
│   │   └── 06_MultiSensor.ino
│   └── 07_SyncOnConnect/
│       └── 07_SyncOnConnect.ino
├── library.properties
└── README.md
```

---

## 3. KuroHubPin.h

```cpp
// src/KuroHubPin.h
#pragma once

// Virtual pin constants: V0 sampai V255
#define V0   0
#define V1   1
#define V2   2
#define V3   3
#define V4   4
#define V5   5
#define V6   6
#define V7   7
#define V8   8
#define V9   9
#define V10  10
// ... dst hingga V255
#define V255 255
```

---

## 4. KuroHub.h (Header)

```cpp
// src/KuroHub.h
#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "KuroHubPin.h"

// ─── Tipe callback untuk KUROHUB_WRITE ────────────────────
typedef void (*KuroHubWriteCallback)(uint8_t pin, String value);

// ─── Callback registry ────────────────────────────────────
struct PinCallback {
  uint8_t pin;
  KuroHubWriteCallback callback;
};

// ─── Kelas utama ──────────────────────────────────────────
class KuroHubClass {
public:
  // Setup & loop
  void begin(const char* host, uint16_t port, const char* apiKey);
  void run();    // panggil di loop()

  // Kirim nilai ke dashboard
  void virtualWrite(uint8_t pin, int value);
  void virtualWrite(uint8_t pin, float value);
  void virtualWrite(uint8_t pin, double value);
  void virtualWrite(uint8_t pin, const String& value);
  void virtualWrite(uint8_t pin, const char* value);

  // Minta nilai terkini dari server (response via callback)
  void syncVirtualPin(uint8_t pin);

  // Status koneksi
  bool isConnected();
  String getDeviceId();

  // Internal (dipakai oleh macro KUROHUB_WRITE)
  void _registerCallback(uint8_t pin, KuroHubWriteCallback cb);
  void _handleMessage(uint8_t* payload, size_t length);
  void _onWsEvent(WStype_t type, uint8_t* payload, size_t length);

  // Debug
  void setDebug(bool enable);

private:
  WebSocketsClient _ws;
  const char* _apiKey;
  String _deviceId;
  bool _authenticated = false;
  bool _debug = false;

  static const uint8_t MAX_CALLBACKS = 32;
  PinCallback _callbacks[MAX_CALLBACKS];
  uint8_t _callbackCount = 0;

  void _sendJson(JsonDocument& doc);
  void _authenticate();
  KuroHubWriteCallback _findCallback(uint8_t pin);
};

// ─── Global instance ──────────────────────────────────────
extern KuroHubClass KuroHub;

// ─── Macro untuk mendaftarkan callback per pin ────────────
//
// Penggunaan:
//   KUROHUB_WRITE(V5) {
//     int val = param.asInt();
//     digitalWrite(RELAY_PIN, val);
//   }
//
#define KUROHUB_WRITE(pin)                                          \
  void _kurohub_write_##pin##_handler(uint8_t _pin, String _raw);  \
  struct _KuroHubRegister_##pin {                                   \
    _KuroHubRegister_##pin() {                                      \
      KuroHub._registerCallback(pin,                                \
        _kurohub_write_##pin##_handler);                            \
    }                                                               \
  } _kurohub_reg_##pin;                                             \
  void _kurohub_write_##pin##_handler(uint8_t _pin, String _raw)
```

---

## 5. KuroHub.cpp (Implementasi)

```cpp
// src/KuroHub.cpp
#include "KuroHub.h"

KuroHubClass KuroHub;

// ─── begin() ──────────────────────────────────────────────
void KuroHubClass::begin(const char* host, uint16_t port, const char* apiKey) {
  _apiKey = apiKey;

  _ws.begin(host, port, "/ws/device");
  _ws.onEvent([](WStype_t type, uint8_t* payload, size_t length) {
    KuroHub._onWsEvent(type, payload, length);
  });
  _ws.setReconnectInterval(5000);
  _ws.enableHeartbeat(15000, 3000, 2);  // ping setiap 15 detik
}

// ─── run() ────────────────────────────────────────────────
void KuroHubClass::run() {
  _ws.loop();
}

// ─── WebSocket event handler ──────────────────────────────
void KuroHubClass::_onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      if (_debug) Serial.println("[KuroHub] Connected, authenticating...");
      _authenticate();
      break;

    case WStype_TEXT:
      _handleMessage(payload, length);
      break;

    case WStype_DISCONNECTED:
      _authenticated = false;
      _deviceId = "";
      if (_debug) Serial.println("[KuroHub] Disconnected. Reconnecting...");
      break;

    case WStype_ERROR:
      if (_debug) Serial.println("[KuroHub] WebSocket error");
      break;

    default:
      break;
  }
}

// ─── Authenticate ke server ────────────────────────────────
void KuroHubClass::_authenticate() {
  StaticJsonDocument<128> doc;
  doc["type"]    = "auth";
  doc["api_key"] = _apiKey;
  _sendJson(doc);
}

// ─── Handle incoming messages ─────────────────────────────
void KuroHubClass::_handleMessage(uint8_t* payload, size_t length) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    if (_debug) Serial.printf("[KuroHub] JSON parse error: %s\n", err.c_str());
    return;
  }

  const char* type = doc["type"];

  // ── Auth response ───────────────────────────────────────
  if (strcmp(type, "auth_ok") == 0) {
    _authenticated = true;
    _deviceId = doc["device_id"].as<String>();
    if (_debug) {
      Serial.printf("[KuroHub] Auth OK. Device: %s (%s)\n",
        doc["name"].as<const char*>(), _deviceId.c_str());
    }
    return;
  }

  if (strcmp(type, "auth_error") == 0) {
    if (_debug) Serial.println("[KuroHub] Auth FAILED. Periksa API key.");
    return;
  }

  // ── Pin update dari dashboard ───────────────────────────
  if (strcmp(type, "pin_update") == 0) {
    uint8_t pin    = doc["pin"];
    String  value  = doc["value"].as<String>();

    if (_debug) {
      Serial.printf("[KuroHub] Pin update V%d = %s\n", pin, value.c_str());
    }

    KuroHubWriteCallback cb = _findCallback(pin);
    if (cb) cb(pin, value);
    return;
  }

  // ── Sync response (nilai terkini dari server) ───────────
  if (strcmp(type, "pin_sync") == 0) {
    uint8_t pin   = doc["pin"];
    String  value = doc["value"].as<String>();

    KuroHubWriteCallback cb = _findCallback(pin);
    if (cb) cb(pin, value);
    return;
  }
}

// ─── virtualWrite overloads ───────────────────────────────
void KuroHubClass::virtualWrite(uint8_t pin, int value) {
  virtualWrite(pin, String(value));
}
void KuroHubClass::virtualWrite(uint8_t pin, float value) {
  virtualWrite(pin, String(value, 2));
}
void KuroHubClass::virtualWrite(uint8_t pin, double value) {
  virtualWrite(pin, String(value, 4));
}
void KuroHubClass::virtualWrite(uint8_t pin, const char* value) {
  virtualWrite(pin, String(value));
}
void KuroHubClass::virtualWrite(uint8_t pin, const String& value) {
  if (!_authenticated) return;

  StaticJsonDocument<256> doc;
  doc["type"]  = "pin_write";
  doc["pin"]   = pin;
  doc["value"] = value;
  _sendJson(doc);

  if (_debug) {
    Serial.printf("[KuroHub] virtualWrite V%d = %s\n", pin, value.c_str());
  }
}

// ─── syncVirtualPin ───────────────────────────────────────
void KuroHubClass::syncVirtualPin(uint8_t pin) {
  if (!_authenticated) return;
  StaticJsonDocument<128> doc;
  doc["type"] = "pin_sync_request";
  doc["pin"]  = pin;
  _sendJson(doc);
}

// ─── Helper ───────────────────────────────────────────────
void KuroHubClass::_sendJson(JsonDocument& doc) {
  String out;
  serializeJson(doc, out);
  _ws.sendTXT(out);
}

bool KuroHubClass::isConnected() {
  return _authenticated;
}

String KuroHubClass::getDeviceId() {
  return _deviceId;
}

void KuroHubClass::setDebug(bool enable) {
  _debug = enable;
}

void KuroHubClass::_registerCallback(uint8_t pin, KuroHubWriteCallback cb) {
  if (_callbackCount >= MAX_CALLBACKS) return;
  _callbacks[_callbackCount++] = { pin, cb };
}

KuroHubWriteCallback KuroHubClass::_findCallback(uint8_t pin) {
  for (uint8_t i = 0; i < _callbackCount; i++) {
    if (_callbacks[i].pin == pin) return _callbacks[i].callback;
  }
  return nullptr;
}
```

---

## 6. Contoh Kode Lengkap

### Contoh 01 — Basic Connect

```cpp
// examples/01_BasicConnect/01_BasicConnect.ino
#include <KuroHub.h>

#define WIFI_SSID   "YourWiFi"
#define WIFI_PASS   "YourPassword"
#define KH_HOST     "192.168.1.100"   // IP server KuroHub
#define KH_PORT     3001
#define KH_API_KEY  "kurohub_api_key_dari_dashboard"

void setup() {
  Serial.begin(115200);
  KuroHub.setDebug(true);  // aktifkan log Serial

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();  // wajib dipanggil di setiap loop
}
```

---

### Contoh 02 — Kirim Data Sensor (DHT22)

```cpp
// examples/02_VirtualPinRead/02_VirtualPinRead.ino
// V0 = Suhu, V1 = Kelembapan, V2 = Heat Index
#include <KuroHub.h>
#include <DHT.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define DHT_PIN  4
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

// Interval kirim data (5 detik)
unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();

  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (!isnan(temp) && !isnan(hum)) {
      float hi = dht.computeHeatIndex(temp, hum, false);

      KuroHub.virtualWrite(V0, temp);   // → widget "Suhu"
      KuroHub.virtualWrite(V1, hum);    // → widget "Kelembapan"
      KuroHub.virtualWrite(V2, hi);     // → widget "Heat Index"
    }
  }
}
```

---

### Contoh 03 — Kontrol Relay via Button Widget

```cpp
// examples/03_ButtonControl/03_ButtonControl.ino
// Dashboard: Button widget → V5
// ESP32: terima nilai 1/0, nyalakan/matikan relay
#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define RELAY_PIN 26
#define LED_PIN   2

// Callback: dipanggil otomatis saat dashboard klik button
KUROHUB_WRITE(V5) {
  int val = _raw.toInt();
  digitalWrite(RELAY_PIN, val);
  digitalWrite(LED_PIN, val);

  // Feedback: kirim status balik ke dashboard (V6 = status LED)
  KuroHub.virtualWrite(V6, val ? "1" : "0");

  Serial.printf("Relay V5 = %d\n", val);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();
}
```

---

### Contoh 04 — Kontrol Motor via Slider

```cpp
// examples/04_SliderControl/04_SliderControl.ino
// Dashboard: Slider widget (0–255) → V10
// ESP32: atur kecepatan motor via PWM
#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define MOTOR_PIN 18  // PWM pin
#define PWM_CHANNEL 0
#define PWM_FREQ    5000
#define PWM_RES     8  // 8-bit = 0–255

KUROHUB_WRITE(V10) {
  int speed = constrain(_raw.toInt(), 0, 255);
  ledcWrite(PWM_CHANNEL, speed);

  // Kirim nilai aktual kembali ke display widget
  KuroHub.virtualWrite(V11, speed);

  Serial.printf("Motor speed V10 = %d\n", speed);
}

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RES);
  ledcAttachPin(MOTOR_PIN, PWM_CHANNEL);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);

  // Minta nilai slider terkini dari server saat startup
  // (supaya motor langsung sesuai posisi slider terakhir)
  delay(2000);  // tunggu auth selesai
  KuroHub.syncVirtualPin(V10);
}

void loop() {
  KuroHub.run();
}
```

---

### Contoh 05 — Toggle Relay

```cpp
// examples/05_ToggleRelay/05_ToggleRelay.ino
// Toggle widget ON/OFF → V7 → kontrol relay
#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define RELAY_PIN 27

KUROHUB_WRITE(V7) {
  bool on = (_raw == "1");
  // Relay aktif LOW (common di modul relay)
  digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  Serial.printf("Toggle V7: %s\n", on ? "ON" : "OFF");
}

// Restore state saat reconnect
void onKuroHubConnect() {
  KuroHub.syncVirtualPin(V7);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);  // relay off (aktif LOW)

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();
}
```

---

### Contoh 06 — Multi Sensor Lengkap

```cpp
// examples/06_MultiSensor/06_MultiSensor.ino
// Kombinasi: sensor + relay + slider + LED feedback
// Pin mapping:
//   V0 = Suhu (read)         → LineChart + ValueDisplay
//   V1 = Kelembapan (read)   → Gauge
//   V2 = Level air (read)    → Gauge
//   V3 = Baterai % (read)    → ValueDisplay
//   V5 = Relay pompa (write) → Button widget
//   V6 = Status pompa (read) → LED widget
//   V10= Slider timer (write)→ Slider (0–60 menit)
#include <KuroHub.h>
#include <DHT.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define DHT_PIN   4
#define PUMP_PIN  26
#define WATER_PIN 34  // analog

DHT dht(DHT_PIN, DHT22);
bool pumpOn = false;
unsigned long lastSend = 0;

// ── Callback: kontrol pompa dari button widget ──────────
KUROHUB_WRITE(V5) {
  pumpOn = (_raw == "1");
  digitalWrite(PUMP_PIN, pumpOn ? HIGH : LOW);
  KuroHub.virtualWrite(V6, pumpOn ? "1" : "0");
}

// ── Callback: terima timer dari slider ─────────────────
KUROHUB_WRITE(V10) {
  int minutes = _raw.toInt();
  Serial.printf("Timer pompa: %d menit\n", minutes);
  // TODO: implementasi auto-off timer
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(PUMP_PIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.setDebug(true);
  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();

  if (millis() - lastSend >= 5000) {
    lastSend = millis();

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();
    int   water = map(analogRead(WATER_PIN), 0, 4095, 0, 100);
    float bat  = (analogRead(35) / 4095.0) * 100.0;

    if (!isnan(temp)) KuroHub.virtualWrite(V0, temp);
    if (!isnan(hum))  KuroHub.virtualWrite(V1, hum);
    KuroHub.virtualWrite(V2, water);
    KuroHub.virtualWrite(V3, bat);
  }
}
```

---

## 7. library.properties

```ini
name=KuroHub
version=1.0.0
author=KuroHub Team
maintainer=KuroHub Team <support@kurohub.io>
sentence=Official ESP32 library for KuroHub IoT Platform
paragraph=Connect your ESP32 to KuroHub dashboard with Virtual Pin support. Supports real-time data streaming, widget control (button, slider, toggle), and auto-reconnect.
category=Communication
url=https://github.com/yourname/kurohub
architectures=esp32
depends=WebSockets,ArduinoJson
```

---

## 8. Dependencies Library (Arduino)

Install via Arduino Library Manager sebelum menggunakan KuroHub.h:

| Library | Versi | Keterangan |
|---------|-------|------------|
| **WebSockets** by Markus Sattler | >= 2.4.0 | WebSocket client untuk ESP32 |
| **ArduinoJson** by Benoit Blanchon | >= 6.21.0 | Parse & serialize JSON |

---

## 9. API Reference

### Setup

| Fungsi | Parameter | Keterangan |
|--------|-----------|------------|
| `KuroHub.begin(host, port, apiKey)` | host: string, port: int, apiKey: string | Inisialisasi koneksi WebSocket |
| `KuroHub.run()` | — | Wajib dipanggil di `loop()`, proses event WS |
| `KuroHub.setDebug(true)` | bool | Aktifkan log Serial |

### Read / Write

| Fungsi | Keterangan |
|--------|------------|
| `KuroHub.virtualWrite(Vx, value)` | Kirim nilai ke dashboard. `value` bisa `int`, `float`, `double`, `String` |
| `KuroHub.syncVirtualPin(Vx)` | Minta nilai terkini pin dari server → trigger callback `KUROHUB_WRITE(Vx)` |

### Callback

| Macro | Keterangan |
|-------|------------|
| `KUROHUB_WRITE(Vx) { ... }` | Definisikan handler saat dashboard kirim nilai ke pin Vx |

**Di dalam callback**, variabel yang tersedia:
```cpp
KUROHUB_WRITE(V5) {
  // _pin  → uint8_t, nomor pin (5)
  // _raw  → String, nilai raw dari dashboard ("1", "255", "hello")

  int    intVal    = _raw.toInt();
  float  floatVal  = _raw.toFloat();
  String stringVal = _raw;
}
```

### Status

| Fungsi | Return | Keterangan |
|--------|--------|------------|
| `KuroHub.isConnected()` | `bool` | True jika sudah auth & connected |
| `KuroHub.getDeviceId()` | `String` | UUID device dari server |

---

## 10. Best Practices

**Interval kirim data minimal 1 detik.** Server memiliki rate limit 1 pesan/detik per device.
```cpp
// ✅ Benar
if (millis() - lastSend >= 1000) { KuroHub.virtualWrite(V0, temp); }

// ❌ Salah — akan di-drop oleh server
KuroHub.virtualWrite(V0, temp);  // di dalam loop() tanpa delay
```

**Inisialisasi WiFi sebelum KuroHub.begin().**
```cpp
// ✅ Benar
WiFi.begin(ssid, pass);
while (WiFi.status() != WL_CONNECTED) delay(500);
KuroHub.begin(host, port, apiKey);
```

**Gunakan `syncVirtualPin()` saat startup** untuk restore state widget control.
```cpp
// Di setup() setelah KuroHub.begin(), tambahkan delay singkat agar auth selesai
delay(2000);
KuroHub.syncVirtualPin(V5);   // restore status relay
KuroHub.syncVirtualPin(V10);  // restore posisi slider
```

**Jangan pakai `delay()` panjang di `loop()`** — akan menggangu WebSocket heartbeat.
```cpp
// ✅ Gunakan millis() timing
unsigned long lastSend = 0;
void loop() {
  KuroHub.run();
  if (millis() - lastSend >= 5000) {
    lastSend = millis();
    // kirim data
  }
}

// ❌ Jangan
void loop() {
  KuroHub.run();
  delay(5000);  // ini akan memutus heartbeat WS
  // kirim data
}
```

**Tangani nilai NaN dari sensor DHT.**
```cpp
float temp = dht.readTemperature();
if (!isnan(temp)) {
  KuroHub.virtualWrite(V0, temp);
}
```
