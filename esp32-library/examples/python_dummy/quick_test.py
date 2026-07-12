#!/usr/bin/env python3
"""Kirim 1 data sensor lalu exit — edit API_KEY di bawah."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "python"))
from kurohub import KuroHub, V0, V1

# ═══════════════════════════════════════════════════════════
API_KEY = "kurohub_api_key_dari_dashboard"
HOST = "kurohub.fahmyalmaliki.uk"
PORT = 443
# ═══════════════════════════════════════════════════════════

use_ssl = PORT == 443
proto = "wss" if use_ssl else "ws"
kh = KuroHub(f"{proto}://{HOST}:{PORT}/ws/device", API_KEY)
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
