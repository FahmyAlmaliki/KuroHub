# KuroHub — ESP32 Arduino Library

Official ESP32 library for the KuroHub self-hosted IoT dashboard platform.

## Features

- WebSocket connection with auto-reconnect
- `KuroHub.virtualWrite(Vx, value)` — send sensor data to dashboard
- `KUROHUB_WRITE(Vx) { }` — receive widget commands (button, slider, toggle)
- `KuroHub.syncVirtualPin(Vx)` — restore widget states after reconnect
- Non-blocking design — call `KuroHub.run()` in `loop()`

## Installation

### Via Arduino Library Manager
1. Open Arduino IDE → Sketch → Include Library → Manage Libraries
2. Search for "KuroHub"
3. Install

### Manual
Copy the `src/` folder contents to:
```
~/Arduino/libraries/KuroHub/
```

## Dependencies
Install via Library Manager:
- **WebSockets** by Markus Sattler (>= 2.4.0)
- **ArduinoJson** by Benoit Blanchon (>= 6.21.0)

## Quick Start

```cpp
#include <KuroHub.h>

void setup() {
  WiFi.begin("SSID", "PASS");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  KuroHub.begin("kurohub.fahmyalmaliki.uk", 443, "your_api_key", true); // true = WSS
}

void loop() {
  KuroHub.run();
}
```

## API Overview

| Function | Description |
|----------|-------------|
| `KuroHub.begin(host, port, apiKey, useSSL?)` | Connect to KuroHub server (useSSL=true for WSS) |
| `KuroHub.run()` | Call in `loop()`, processes WebSocket events |
| `KuroHub.virtualWrite(Vx, value)` | Send value to dashboard (int, float, double, String) |
| `KuroHub.syncVirtualPin(Vx)` | Request latest pin value from server |
| `KuroHub.isConnected()` | Returns true if authenticated |
| `KuroHub.getDeviceId()` | Returns device UUID from server |
| `KuroHub.setDebug(bool)` | Enable/disable Serial debug logs |
| `KUROHUB_WRITE(Vx) { }` | Define handler for dashboard-to-device writes |

## Examples

- **01_BasicConnect** — minimal connection setup
- **02_VirtualPinRead** — DHT22 sensor data (temperature, humidity)
- **03_ButtonControl** — relay control via button widget
- **04_SliderControl** — motor PWM control via slider
- **05_ToggleRelay** — toggle switch with active-LOW relay
- **06_MultiSensor** — combined sensors + relay + slider
- **07_SyncOnConnect** — restore widget states after reconnect
