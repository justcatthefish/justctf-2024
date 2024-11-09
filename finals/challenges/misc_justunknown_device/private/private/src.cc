#include <Arduino.h>
#include "mbedtls/aes.h"


const uint8_t aesKey[16] = {
    0xf0, 0x2f, 0x20, 0x10, 0x59, 0x6A, 0x79, 0x82,
    0x91, 0xA0, 0xB2, 0xC0, 0xD2, 0xE0, 0xF0, 0x02
};


#define AES_BLOCK_SIZE 16


char inputMessage[256];


HardwareSerial uart1(1);


void encryptAES(const uint8_t *input, uint8_t *output, size_t length) {
    mbedtls_aes_context aes;
    uint8_t iv[AES_BLOCK_SIZE] = {0};  

    
    mbedtls_aes_init(&aes);
    
    
    mbedtls_aes_setkey_enc(&aes, aesKey, 128);  

    
    mbedtls_aes_crypt_cbc(&aes, MBEDTLS_AES_ENCRYPT, length, iv, input, output);

    
    mbedtls_aes_free(&aes);
}

void setup() {

    Serial.begin(115200);
    while (!Serial); 

    uart1.begin(115200, SERIAL_8N1, 16, 17);  

    Serial.println("Enter a message to encrypt:");
}

void loop() {
    if (Serial.available()) {
        size_t len = Serial.readBytesUntil('\n', inputMessage, sizeof(inputMessage) - 1);
        inputMessage[len] = '\0';  

        Serial.print("Original message: ");
        Serial.println(inputMessage);

        
        size_t paddedLen = (len / AES_BLOCK_SIZE + 1) * AES_BLOCK_SIZE;

        uint8_t inputBuffer[paddedLen];
        uint8_t outputBuffer[paddedLen];


        memset(inputBuffer, 0, paddedLen);
        memcpy(inputBuffer, inputMessage, len);

        encryptAES(inputBuffer, outputBuffer, paddedLen);

        uart1.println("Encrypted message (HEX) via UART1:");
        for (size_t i = 0; i < paddedLen; i++) {
            char hexByte[3];
            sprintf(hexByte, "%02X", outputBuffer[i]);
            uart1.print(hexByte);
            uart1.print(" ");
        }
        uart1.println();

        Serial.println("Encrypted message (HEX) via Serial:");
        for (size_t i = 0; i < paddedLen; i++) {
            char hexByte[3];
            sprintf(hexByte, "%02X", outputBuffer[i]);
            Serial.print(hexByte);
            Serial.print(" ");
        }
        Serial.println();

        
        memset(inputMessage, 0, sizeof(inputMessage));
    }
}
