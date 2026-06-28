# KuroHub Python Library

Library Python untuk testing KuroHub tanpa ESP32. API-nya mirip dengan `KuroHub.h` Arduino library.

## Install

```bash
pip install -e esp32-library/python
```

Atau langsung:

```bash
pip install websocket-client
```

## Contoh

### Kirim data sensor

```python
from kurohub import KuroHub, V0, V1
import time

kh = KuroHub("ws://localhost/ws/device", "kurohub_api_key_anda")
kh.set_debug(True)
kh.begin()

time.sleep(2)  # tunggu auth

while kh.is_connected():
    kh.virtual_write(V0, 28.5)
    kh.virtual_write(V1, 65.0)
    time.sleep(3)
```

### Terima perintah dari dashboard

```python
from kurohub import KuroHub, V5

kh = KuroHub("ws://localhost/ws/device", "kurohub_api_key_anda")
kh.begin()

@kh.on_write(V5)
def relay_handler(pin, value):
    print(f"Relay V{pin} → {'ON' if value == '1' else 'OFF'}")

# atau pakai decorator global
@KUROHUB_WRITE(V10)
def slider_handler(pin, value):
    print(f"Slider V{pin} = {value}")

input("Tekan Enter untuk exit...\n")
kh.disconnect()
```
