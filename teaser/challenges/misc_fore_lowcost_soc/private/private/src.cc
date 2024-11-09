#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <AESLib.h>
#include <Crypto.h>

const char* ssid = "jctf";
const char* psk = "thisisnotaflag";

WebServer server(80);
const int EEPROM_SIZE = 512;
const int PASSWORD_ADDR = 0;
const int FLAG_ADDR = 100;
const int AES_KEY_SIZE = 16;
const int ENCRYPTED_FLAG_SIZE = 32;

bool unlocked = false;
uint8_t aesKey[AES_KEY_SIZE] = { 0x33, 0xbd, 0xfb, 0x72, 0x4c, 0x22, 0x87, 0x33, 0x62, 0xff, 0x75, 0x41, 0xd5, 0x14, 0xf6, 0xfd };

void decryptFlag(uint8_t* encryptedFlag, uint8_t* decryptedFlag, int length) {
    AESLib aesLib;
    byte iv[AES_KEY_SIZE] = {0};
    aesLib.decrypt(encryptedFlag, length, decryptedFlag, aesKey, sizeof(aesKey), iv);
}

void handleRoot() {
    Serial.println("here");
    String htmlContent = R"rawliteral(
        <!DOCTYPE html>
        <html>
        <head>
            <title>ESP32 Web Server</title>
        </head>
        <body>
            <h1>Hello from ESP32!</h1>
            <form action="/" method="POST">
                <label for="password">Enter Password:</label>
                <input type="text" id="password" name="password"><br><br>
                <input type="submit" value="Submit">
            </form>
    )rawliteral";

    if (unlocked) {
        Serial.println("here2");
        uint8_t encryptedFlag[ENCRYPTED_FLAG_SIZE];
        uint8_t decryptedFlag[ENCRYPTED_FLAG_SIZE];
        EEPROM.get(FLAG_ADDR, encryptedFlag);
        decryptFlag(encryptedFlag, decryptedFlag, ENCRYPTED_FLAG_SIZE);
        String flag = String((char*)decryptedFlag);

        htmlContent += "<h2>Flag: " + flag + "</h2>";
        Serial.println(flag);
    }

    htmlContent += "</body></html>";
    server.send(200, "text/html", htmlContent);
}

void handlePost() {
    if (server.hasArg("password")) {
        Serial.println("got password");
        
        String submittedPassword = server.arg("password");

        String storedPassword = EEPROM.readString(PASSWORD_ADDR);
        submittedPassword.trim();

        if (submittedPassword == storedPassword) {
            unlocked = true;
            Serial.println("we are unlocked!");
        }


    }

    handleRoot();
}

void setup() {
    Serial.begin(115200);
    EEPROM.begin(EEPROM_SIZE);

    WiFi.softAP(ssid, psk);
    Serial.println("Access Point started");
    Serial.print("IP address: ");
    Serial.println(WiFi.softAPIP());

    server.on("/", HTTP_GET, handleRoot);
    server.on("/", HTTP_POST, handlePost);
    server.begin();
    Serial.println("HTTP server started");

    // Uncomment these lines to write the initial data to EEPROM
    // run & remove & flash once again
    EEPROM.writeString(PASSWORD_ADDR, "thisisnotaflag");
    EEPROM.commit();

    for (int i = PASSWORD_ADDR + EEPROM.readString(PASSWORD_ADDR).length() + 1; i < FLAG_ADDR - 1; i++) {
      EEPROM.write(i, random(0, 256));
    }
    EEPROM.commit();

    uint8_t encryptedFlag[ENCRYPTED_FLAG_SIZE] = {0x8f, 0xbb, 0x3b, 0x52, 0xdf, 0x2b, 0xaa, 0xd5, 0x44, 0x75, 0x49, 0xbf, 0x29, 0xe7, 0x0f, 0x58, 0x0a, 0xa6, 0x15, 0x8a, 0x34, 0x82, 0x99, 0xad, 0xac, 0xec, 0x0c, 0xd3, 0x26, 0x75, 0x59, 0xf2};
    EEPROM.put(FLAG_ADDR, encryptedFlag);
    EEPROM.commit();
    Serial.println("Data saved");
    
}

void loop() {
    server.handleClient();
}
