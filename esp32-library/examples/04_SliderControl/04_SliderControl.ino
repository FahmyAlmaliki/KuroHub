#include <KuroHub.h>

#define WIFI_SSID  "YourWiFi"
#define WIFI_PASS  "YourPassword"
#define KH_HOST    "192.168.1.100"
#define KH_PORT    3001
#define KH_API_KEY "kurohub_api_key_dari_dashboard"

#define MOTOR_PIN 18
#define PWM_CHANNEL 0
#define PWM_FREQ    5000
#define PWM_RES     8

KUROHUB_WRITE(V10) {
  int speed = constrain(_raw.toInt(), 0, 255);
  ledcWrite(PWM_CHANNEL, speed);

  KuroHub.virtualWrite(V11, speed);

  Serial.printf("Motor speed V10 = %d\n", speed);
}

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RES);
  ledcAttachPin(MOTOR_PIN, PWM_CHANNEL);

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  KuroHub.begin(KH_HOST, KH_PORT, KH_API_KEY);

  delay(2000);
  KuroHub.syncVirtualPin(V10);
}

void loop() {
  KuroHub.run();
}
