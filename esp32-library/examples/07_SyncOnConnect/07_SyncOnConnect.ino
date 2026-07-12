#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "kurohub.fahmyalmaliki.uk"
#define KH_PORT    443
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define RELAY_1_PIN 26
#define RELAY_2_PIN 27
#define SLIDER_PIN  18

KUROHUB_WRITE(V0) {
  int val = _raw.toInt();
  digitalWrite(RELAY_1_PIN, val);
  Serial.printf("Relay 1 restored: %d\n", val);
}

KUROHUB_WRITE(V1) {
  int val = _raw.toInt();
  digitalWrite(RELAY_2_PIN, val ? LOW : HIGH);
  Serial.printf("Relay 2 restored: %d\n", val);
}

KUROHUB_WRITE(V2) {
  int speed = constrain(_raw.toInt(), 0, 255);
  ledcWrite(0, speed);
  Serial.printf("Slider restored: %d\n", speed);
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_1_PIN, OUTPUT);
  pinMode(RELAY_2_PIN, OUTPUT);
  digitalWrite(RELAY_2_PIN, HIGH);

  ledcSetup(0, 5000, 8);
  ledcAttachPin(SLIDER_PIN, 0);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY, true);
}

void loop() {
  KuroHub.run();

  static unsigned long syncDelay = 0;
  if (!syncDelay && KuroHub.isConnected()) {
    syncDelay = millis();
  }

  if (syncDelay && millis() - syncDelay >= 2000) {
    syncDelay = 0;
    Serial.println("[Sync] Restoring widget states...");
    KuroHub.syncVirtualPin(V0);
    KuroHub.syncVirtualPin(V1);
    KuroHub.syncVirtualPin(V2);
  }
}
