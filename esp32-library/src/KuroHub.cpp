#include "KuroHub.h"

KuroHubClass KuroHub;

void KuroHubClass::begin(const char* host, uint16_t port, const char* apiKey, bool useSSL) {
  _apiKey = apiKey;

  if (useSSL) {
    _ws.beginSSL(host, port, "/ws/device");
  } else {
    _ws.begin(host, port, "/ws/device");
  }
  _ws.onEvent([](WStype_t type, uint8_t* payload, size_t length) {
    KuroHub._onWsEvent(type, payload, length);
  });
  _ws.setReconnectInterval(5000);
  _ws.enableHeartbeat(15000, 3000, 2);
}

void KuroHubClass::run() {
  _ws.loop();
}

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

void KuroHubClass::_authenticate() {
  StaticJsonDocument<128> doc;
  doc["type"]    = "auth";
  doc["api_key"] = _apiKey;
  _sendJson(doc);
}

void KuroHubClass::_handleMessage(uint8_t* payload, size_t length) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    if (_debug) Serial.printf("[KuroHub] JSON parse error: %s\n", err.c_str());
    return;
  }

  const char* type = doc["type"];

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

  if (strcmp(type, "pin_sync") == 0) {
    uint8_t pin   = doc["pin"];
    String  value = doc["value"].as<String>();

    KuroHubWriteCallback cb = _findCallback(pin);
    if (cb) cb(pin, value);
    return;
  }
}

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

void KuroHubClass::syncVirtualPin(uint8_t pin) {
  if (!_authenticated) return;
  StaticJsonDocument<128> doc;
  doc["type"] = "pin_sync_request";
  doc["pin"]  = pin;
  _sendJson(doc);
}

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
