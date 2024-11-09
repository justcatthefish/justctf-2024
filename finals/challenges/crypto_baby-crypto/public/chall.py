import secrets
import os
import binascii

flag = os.getenv("FLAG", "justCTF{FAKE_FLAG}").encode("UTF-8")

def encrypt(input):
    output = bytearray(len(input))
    for i in range(len(input)):
        output[i] = (input[i] ^ secrets.randbelow(1337)) & 0xff
    return output

while True:
    print('''enterprise 1337 one time pad encryptor
press enter to get flag''')
    input()
    print(binascii.hexlify(encrypt(flag)).decode())