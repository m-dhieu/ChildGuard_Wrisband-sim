#include <WiFi.h>
#include <PubSubClient.h>  // install in Wokwi
#include <ArduinoJson.h>

const char* ssid = "WokWI-GUEST";
const char* password = "";
const char* mqtt_server = "test.mosquitto.org";  // public for Wokwi

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPub = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, 1883);
  client.connect("wokwi-esp32");
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  if (millis() - lastPub > 30000) {  // 30s
    // Mock data
    float lat = 15.5 + random(-10,10)/1000.0;
    float lon = 32.5 + random(-10,10)/1000.0;
    int hr = 70 + random(0,60);  // Trigger >90 sometimes
    float accel = 1.0 + random(0,200)/100.0;  // >2g trigger
    int battery = 85 + random(-5,5);
    
    DynamicJsonDocument doc(200);
    doc["gps"]["lat"] = lat;
    doc["gps"]["lon"] = lon;
    doc["hr"] = hr;
    doc["accel"] = accel;
    doc["battery"] = battery;
    
    String payload;
    serializeJson(doc, payload);
    client.publish("childguard/device1/telemetry", payload.c_str());
    
    Serial.println(payload);
    lastPub = millis();
  }
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("wokwi-esp32")) {
      client.subscribe("childguard/device1/telemetry");
    } else {
      delay(5000);
    }
  }
}

