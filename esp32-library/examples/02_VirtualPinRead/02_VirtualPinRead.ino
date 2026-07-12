#include <KuroHub.h>
#include <DHT.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "kurohub.fahmyalmaliki.uk"
#define KH_PORT    443
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define DHT_PIN  4
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 5000;

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY, true);
}

void loop() {
  KuroHub.run();

  if (millis() - lastSend >= SEND_INTERVAL) {
    lastSend = millis();

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (!isnan(temp) && !isnan(hum)) {
      float hi = dht.computeHeatIndex(temp, hum, false);

      KuroHub.virtualWrite(V0, temp);
      KuroHub.virtualWrite(V1, hum);
      KuroHub.virtualWrite(V2, hi);
    }
  }
}
