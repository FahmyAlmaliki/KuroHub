#include <KuroHub.h>

#define WIFI_SSID   "YourWiFi"
#define WIFI_PASS   "YourPassword"
#define KH_HOST     "192.168.1.100"
#define KH_PORT     3001
#define KH_API_KEY  "kurohub_api_key_dari_dashboard"

void setup() {
  Serial.begin(115200);
  KuroHub.setDebug(true);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected: " + WiFi.localIP().toString());

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);
}

void loop() {
  KuroHub.run();
}
