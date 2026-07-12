#!/usr/bin/env python3
"""
KuroHub ESP32 Simulator — tinggal edit KONFIGURASI di bawah, lalu jalankan.

Cara pakai:
  1. Buka file ini, edit 3 baris KONFIGURASI di bawah
  2. python3 esp32_simulator.py

Simulasi:
  - V0 (suhu)    → read,  berfluktuasi 26–31°C
  - V1 (kelembapan) → read, berfluktuasi 55–75%
  - V2 (cahaya)  → read,  berfluktuasi 500–1000 lux
  - V3 (relay)   → write, dari dashboard → print
  - V10 (slider) → write, dari dashboard → print
"""

# ═══════════════════════════════════════════════════════════
# 📝 KONFIGURASI — edit 3 baris ini saja
# ═══════════════════════════════════════════════════════════

API_KEY = "kurohub_api_key_dari_dashboard"
HOST = "kurohub.fahmyalmaliki.uk"
PORT = 443

# ═══════════════════════════════════════════════════════════
#  Jangan edit di bawah ini jika tidak perlu
# ═══════════════════════════════════════════════════════════

import math
import random
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "python"))
from kurohub import KuroHub, V0, V1, V2, V3, V10

use_ssl = PORT == 443
proto = "wss" if use_ssl else "ws"
url = f"{proto}://{HOST}:{PORT}/ws/device"

kh = KuroHub(url, API_KEY)
kh.set_debug(True)

@kh.on_write(V3)
def relay(pin, value):
    state = "ON" if value == "1" else "OFF"
    print(f"  🔧 Relay V{pin} → {state}")

@kh.on_write(V10)
def slider(pin, value):
    print(f"  🔧 Slider V{pin} → {value}")

kh.begin()
print("Menunggu auth...")
time.sleep(2)

if not kh.is_connected():
    print("❌ Gagal autentikasi. Periksa API key dan koneksi.")
    sys.exit(1)

print(f"✅ Connected! Device ID: {kh.get_device_id()}")
print(f"   Mengirim V0 (suhu), V1 (kelembapan), V2 (cahaya) tiap 3 detik")
print(f"   Mendengarkan V3 (relay), V10 (slider)")
print("Tekan Ctrl+C untuk berhenti.\n")

try:
    while kh.is_connected():
        t = time.time()
        suhu = round(28.5 + math.sin(t * 0.1) * 2 + random.uniform(-0.3, 0.3), 1)
        hum = round(65 + math.sin(t * 0.05) * 10 + random.uniform(-1, 1), 1)
        cahaya = round(750 + math.sin(t * 0.02) * 200 + random.uniform(-10, 10), 0)

        kh.virtual_write(V0, suhu)
        kh.virtual_write(V1, hum)
        kh.virtual_write(V2, cahaya)

        print(f"  📤 V0={suhu}°C  V1={hum}%  V2={cahaya}lux")
        time.sleep(3)
except KeyboardInterrupt:
    print("\n⏹  Berhenti...")
finally:
    kh.disconnect()
