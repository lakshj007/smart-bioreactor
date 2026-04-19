#include <Arduino_RouterBridge.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define ONE_WIRE_BUS A2
#define SERVO_PIN 9
#define BUTTON_PIN 2

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

bool stirring = false;
bool lastButtonState = HIGH;
int tempCounter = 0;
String inBuf = "";

void setServoAngle(int angle) {
  int pulseWidth = map(angle, 0, 180, 544, 2400);
  digitalWrite(SERVO_PIN, HIGH);
  delayMicroseconds(pulseWidth);
  digitalWrite(SERVO_PIN, LOW);
  delay(10);
}

void reportStirring() {
  Monitor.println(stirring ? "STATE:STIR:ON" : "STATE:STIR:OFF");
}

void setStirring(bool on) {
  if (stirring != on) {
    stirring = on;
    reportStirring();
  }
}

void checkButton() {
  bool buttonState = digitalRead(BUTTON_PIN);
  if (buttonState == LOW && lastButtonState == HIGH) {
    delay(50);
    setStirring(!stirring);
  }
  lastButtonState = buttonState;
}

void handleCommand(const String& line) {
  String cmd = line;
  cmd.trim();
  cmd.toUpperCase();
  if (cmd == "STIR:ON")  setStirring(true);
  else if (cmd == "STIR:OFF") setStirring(false);
  else if (cmd == "PING") Monitor.println("PONG");
}

void pollHost() {
  while (Monitor.available()) {
    char c = (char)Monitor.read();
    if (c == '\n' || c == '\r') {
      if (inBuf.length() > 0) {
        handleCommand(inBuf);
        inBuf = "";
      }
    } else {
      inBuf += c;
      if (inBuf.length() > 64) inBuf = "";  // guard
    }
  }
}

void setup() {
  Monitor.begin();
  sensors.begin();
  pinMode(SERVO_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  delay(1000);
  Monitor.println("Ready");
  reportStirring();
}

void loop() {
  pollHost();
  checkButton();

  if (stirring) {
    setServoAngle(0);
  } else {
    setServoAngle(90);
  }

  tempCounter++;
  if (tempCounter >= 50) {
    tempCounter = 0;
    sensors.requestTemperatures();
    float tempC = sensors.getTempCByIndex(0);
    Monitor.print("Temp: ");
    Monitor.print(tempC);
    Monitor.println(" C");
    Monitor.print("DATA:");
    Monitor.println(tempC);
  }
}
