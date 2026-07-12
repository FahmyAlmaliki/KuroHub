"""
KuroHub Python Library — testing KuroHub tanpa ESP32.

API mirip KuroHub.h Arduino library:
    from kurohub import KuroHub

    kh = KuroHub("wss://kurohub.fahmyalmaliki.uk/ws/device", "kurohub_xxxxx")
    kh.begin()

    @kh.on_write(V0)
    def handle_v0(pin, value):
        print(f"V{pin} = {value}")

    while True:
        kh.virtual_write(V0, 28.5)
        time.sleep(3)
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from threading import Thread, Event
from typing import Callable, Optional

logger = logging.getLogger("kurohub")

try:
    import websocket
except ImportError:
    websocket = None  # type: ignore


# ─── Pin Constants ─────────────────────────────────────────────
V0, V1, V2, V3, V4 = 0, 1, 2, 3, 4
V5, V6, V7, V8, V9 = 5, 6, 7, 8, 9
V10, V11, V12, V13, V14, V15 = 10, 11, 12, 13, 14, 15
V16, V17, V18, V19, V20 = 16, 17, 18, 19, 20
V21, V22, V23, V24, V25 = 21, 22, 23, 24, 25
V26, V27, V28, V29, V30 = 26, 27, 28, 29, 30
V31, V32, V33, V34, V35 = 31, 32, 33, 34, 35
# V36–V254: tambah sesuai kebutuhan
V255 = 255


def KUROHUB_WRITE(pin: int):
    """Decorator: daftarkan callback untuk virtual pin write dari dashboard.

    Usage:
        @KUROHUB_WRITE(V5)
        def handle_relay(pin, value):
            print(f"Relay V{pin} = {value}")
    """
    def decorator(fn: Callable):
        KuroHub.register_pin_callback(pin, fn)
        return fn
    return decorator


@dataclass
class _PinCallback:
    pin: int
    callback: Callable[[int, str], None]


class KuroHub:
    """
    KuroHub Python Client — konek ke KuroHub via WebSocket.

    Contoh:
        kh = KuroHub("wss://kurohub.fahmyalmaliki.uk/ws/device", "kurohub_xxxxx")
        kh.set_debug(True)
        kh.begin()

        @kh.on_write(V5)
        def relay_handler(pin, value):
            print(f"V{pin} = {value}")

        while kh.is_connected():
            kh.virtual_write(V0, 28.5)
            time.sleep(3)

        kh.disconnect()
    """

    _global_callbacks: dict[int, list[Callable]] = {}

    def __init__(self, ws_url: str, api_key: str):
        if websocket is None:
            raise ImportError("Required: pip install websocket-client")

        self._ws_url = ws_url
        self._api_key = api_key
        self._device_id: Optional[str] = None
        self._authenticated = False
        self._debug = False
        self._running = Event()
        self._running.set()
        self._ws: Optional[websocket.WebSocketApp] = None
        self._callbacks: list[_PinCallback] = []
        self._cb_lock = Event()
        self._cb_lock.set()

    # ── Public API ─────────────────────────────────────────

    def begin(self) -> None:
        """Mulai koneksi WebSocket ke server KuroHub (non-blocking)."""
        self._ws = websocket.WebSocketApp(
            self._ws_url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )
        t = Thread(target=self._ws.run_forever, kwargs={"reconnect": 5}, daemon=True)
        t.start()

    def virtual_write(self, pin: int, value) -> None:
        """Kirim nilai pin ke dashboard. value bisa int, float, str."""
        if not self._authenticated:
            logger.warning("virtual_write skipped (not authenticated)")
            return
        payload = json.dumps({
            "type": "pin_write",
            "pin": pin,
            "value": str(value),
        })
        self._send(payload)
        if self._debug:
            logger.info(f"virtualWrite V{pin} = {value}")

    def sync_virtual_pin(self, pin: int) -> None:
        """Minta nilai terkini pin dari server → trigger callback."""
        if not self._authenticated:
            return
        payload = json.dumps({
            "type": "pin_sync_request",
            "pin": pin,
        })
        self._send(payload)

    def on_write(self, pin: int):
        """Decorator: daftarkan callback untuk pin write dari dashboard.

        Usage:
            @kh.on_write(V5)
            def handler(pin, value):
                print(f"V{pin} = {value}")
        """
        def decorator(fn: Callable):
            self._callbacks.append(_PinCallback(pin=pin, callback=fn))
            return fn
        return decorator

    @classmethod
    def register_pin_callback(cls, pin: int, fn: Callable):
        """Register global callback (dari decorator KUROHUB_WRITE)."""
        if pin not in cls._global_callbacks:
            cls._global_callbacks[pin] = []
        cls._global_callbacks[pin].append(fn)

    def is_connected(self) -> bool:
        """True jika sudah authenticated & WebSocket terhubung."""
        return self._authenticated and self._ws is not None

    def get_device_id(self) -> Optional[str]:
        return self._device_id

    def set_debug(self, enable: bool) -> None:
        self._debug = enable

    def disconnect(self) -> None:
        """Putus koneksi WebSocket."""
        self._running.clear()
        if self._ws:
            self._ws.close()

    # ── Internal ───────────────────────────────────────────

    def _send(self, payload: str) -> None:
        if self._ws and self._ws.keep_running:
            try:
                self._ws.send(payload)
            except Exception as e:
                logger.error(f"Send failed: {e}")

    def _on_open(self, ws) -> None:
        logger.info("WebSocket connected, authenticating...")
        ws.send(json.dumps({
            "type": "auth",
            "api_key": self._api_key,
        }))

    def _on_message(self, ws, message: str) -> None:
        try:
            msg = json.loads(message)
        except json.JSONDecodeError:
            return

        t = msg.get("type")

        if t == "auth_ok":
            self._authenticated = True
            self._device_id = msg.get("device_id")
            logger.info(f"Authenticated! Device: {msg.get('name', '?')} ({self._device_id})")

        elif t == "auth_error":
            self._authenticated = False
            logger.error(f"Auth failed: {msg.get('message')}")

        elif t == "pin_update":
            pin = msg.get("pin")
            value = msg.get("value", "")
            # Panggil instance callbacks
            for cb in self._callbacks:
                if cb.pin == pin:
                    cb.callback(pin, value)
            # Panggil global callbacks (dari decorator)
            for fn in self._global_callbacks.get(pin, []):
                fn(pin, value)

        elif t == "pin_sync":
            pin = msg.get("pin")
            value = msg.get("value", "")
            for cb in self._callbacks:
                if cb.pin == pin:
                    cb.callback(pin, value)
            for fn in self._global_callbacks.get(pin, []):
                fn(pin, value)

        elif t == "pong":
            pass

    def _on_error(self, ws, error) -> None:
        logger.error(f"WebSocket error: {error}")

    def _on_close(self, ws, close_status_code, close_msg) -> None:
        self._authenticated = False
        logger.info("WebSocket disconnected")
