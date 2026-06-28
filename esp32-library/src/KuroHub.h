#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "KuroHubPin.h"

typedef void (*KuroHubWriteCallback)(uint8_t pin, String value);

struct PinCallback {
  uint8_t pin;
  KuroHubWriteCallback callback;
};

class KuroHubClass {
public:
  void begin(const char* host, uint16_t port, const char* apiKey);
  void run();

  void virtualWrite(uint8_t pin, int value);
  void virtualWrite(uint8_t pin, float value);
  void virtualWrite(uint8_t pin, double value);
  void virtualWrite(uint8_t pin, const String& value);
  void virtualWrite(uint8_t pin, const char* value);

  void syncVirtualPin(uint8_t pin);

  bool isConnected();
  String getDeviceId();

  void _registerCallback(uint8_t pin, KuroHubWriteCallback cb);
  void _handleMessage(uint8_t* payload, size_t length);
  void _onWsEvent(WStype_t type, uint8_t* payload, size_t length);

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

extern KuroHubClass KuroHub;

#define KUROHUB_WRITE(pin)                                          \
  void _kurohub_write_##pin##_handler(uint8_t _pin, String _raw);  \
  struct _KuroHubRegister_##pin {                                   \
    _KuroHubRegister_##pin() {                                      \
      KuroHub._registerCallback(pin,                                \
        _kurohub_write_##pin##_handler);                            \
    }                                                               \
  } _kurohub_reg_##pin;                                             \
  void _kurohub_write_##pin##_handler(uint8_t _pin, String _raw)
