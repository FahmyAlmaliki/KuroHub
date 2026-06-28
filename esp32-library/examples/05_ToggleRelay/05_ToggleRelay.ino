#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define RELAY_PIN 27

KUROHUB_WRITE(V7) {
  bool on = (_raw == "1");
  digitalWrite(RELAY_PIN, on ? LOW : HIGH);
  Serial.printf("Toggle V7: %s\n", on ? "ON" : "OFF");
}

void onKuroHubConnect() {
  KuroHub.syncVirtualPin(V7);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();
}
