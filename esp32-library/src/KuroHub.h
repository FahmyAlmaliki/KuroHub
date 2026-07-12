#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "KuroHubPin.h"

// GTS Root R4 — Google Trust Services (digunakan Cloudflare)
// https://pki.goog/repository/
static const char GTS_ROOT_R4[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----
)EOF";

typedef void (*KuroHubWriteCallback)(uint8_t pin, String value);

struct PinCallback {
  uint8_t pin;
  KuroHubWriteCallback callback;
};

class KuroHubClass {
public:
  void begin(const char* host, uint16_t port, const char* apiKey, bool useSSL = false);
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
