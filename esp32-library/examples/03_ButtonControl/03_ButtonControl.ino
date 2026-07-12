#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "kurohub.fahmyalmaliki.uk"
#define KH_PORT    443
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define RELAY_PIN 26
#define LED_PIN   2

KUROHUB_WRITE(V5) {
  int val = _raw.toInt();
  digitalWrite(RELAY_PIN, val);
  digitalWrite(LED_PIN, val);

  KuroHub.virtualWrite(V6, val ? "1" : "0");

  Serial.printf("Relay V5 = %d\n", val);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY, true);
}

void loop() {
  KuroHub.run();
}
