#include <KuroHub.h>
#include <DHT.h>

#define WIFI_SSID  "Omah Ngarep"
#define WIFI_PASS  "Suropati77b"
#define KH_HOST    "kurohub.fahmyalmaliki.uk"
#define KH_PORT    443
#define KH_API_KEY "kurohub_867866f10219bbb6e78d156e73d4950c27965be89bcfe13a2166f75084152d0d"

#define DHT_PIN   4
#define PUMP_PIN  26
#define WATER_PIN 34

DHT dht(DHT_PIN, DHT22);
bool pumpOn = false;
unsigned long lastSend = 0;

KUROHUB_WRITE(V5) {
  pumpOn = (_raw == "1");
  digitalWrite(PUMP_PIN, pumpOn ? HIGH : LOW);
  KuroHub.virtualWrite(V6, pumpOn ? "1" : "0");
}

KUROHUB_WRITE(V10) {
  int minutes = _raw.toInt();
  Serial.printf("Timer pompa: %d menit\n", minutes);
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(PUMP_PIN, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.setDebug(true);
  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY, true);
}

void loop() {
  KuroHub.run();

  if (millis() - lastSend >= 5000) {
    lastSend = millis();

    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();
    int   water = map(analogRead(WATER_PIN), 0, 4095, 0, 100);
    float bat  = (analogRead(35) / 4095.0) * 100.0;

    if (!isnan(temp)) KuroHub.virtualWrite(V0, temp);
    if (!isnan(hum))  KuroHub.virtualWrite(V1, hum);
    KuroHub.virtualWrite(V2, water);
    KuroHub.virtualWrite(V3, bat);
  }
}


