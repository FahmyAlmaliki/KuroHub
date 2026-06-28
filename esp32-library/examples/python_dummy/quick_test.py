#!/usr/bin/env python3
"""Kirim 1 data sensor lalu exit — edit API_KEY di bawah."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "python"))
from kurohub import KuroHub, V0, V1

# ═══════════════════════════════════════════════════════════
API_KEY = "kurohub_44b446040714ab3c0ce450c516c0140216fb23dab39dbfa333d1e861137ee931"
HOST = "localhost"
PORT = 80
# ═══════════════════════════════════════════════════════════

kh = KuroHub(f"ws://{HOST}:{PORT}/ws/device", API_KEY)
kh.begin()

import time
time.sleep(2)

if kh.is_connected():
    kh.virtual_write(V0, 28.5)
    kh.virtual_write(V1, 65)
    print("✅ Data sent!")
else:
    print("❌ Auth failed")

kh.disconnect()
