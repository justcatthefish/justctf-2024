#include <WiFi.h>
#include <WebServer.h>
#include <EEPROM.h>
#include <AESLib.h>
#include <Crypto.h>

const char* ssid = "jctf";
const char* psk = "thisisnotaflag";
String storedPassword = "thisisnotaflag";

WebServer server(80);
const int FLAG_LEN = 34;

bool unlocked = false;
uint8_t key[FLAG_LEN] = {0x9a, 0xf9, 0xf8, 0x5f, 0x8d, 0xa8, 0xf9, 0x5b, 0x9c, 0xd2, 0x31, 0x22, 0x2b, 0xd6, 0x91, 0xcb, 0x9f, 0x33, 0x03, 0xa4, 0xb8, 0x39, 0xa9, 0xf1, 0xe9, 0xbb, 0xba, 0xa4, 0xa8, 0x4d, 0xd8, 0x14, 0xd3, 0x00};
uint8_t flag[FLAG_LEN] = {0xf0, 0x9a, 0x8c, 0x39, 0xf6, 0xd1, 0x96, 0x2e, 0xc3, 0xaa, 0x01, 0x50, 0x74, 0xbb, 0xf4, 0x94, 0xed, 0x02, 0x64, 0xcc, 0xcc, 0x66, 0xdb, 0xc1, 0x9c, 0xd5, 0xde, 0xfb, 0xca, 0x79, 0xba, 0x6d, 0xae, 0x00};

void decryptFlag(uint8_t* decryptedFlag) {
    for (int i = 0; i < FLAG_LEN; i++) {
      decryptedFlag[i] = flag[i] ^ key[i];
    }
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
        uint8_t decryptedFlag[FLAG_LEN];
        decryptFlag(decryptedFlag);
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
    WiFi.softAP(ssid, psk);
    Serial.println("Access Point started");
    Serial.print("IP address: ");
    Serial.println(WiFi.softAPIP());

    server.on("/", HTTP_GET, handleRoot);
    server.on("/", HTTP_POST, handlePost);
    server.begin();
    Serial.println("HTTP server started");
}

void loop() {
    server.handleClient();
}
