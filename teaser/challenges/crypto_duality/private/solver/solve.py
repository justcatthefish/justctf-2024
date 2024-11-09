import json
import os
import hashlib

from telnetlib import Telnet

HOST = ("127.0.0.1", 1337)

def read(tn: Telnet) -> dict:
    msg = tn.read_until(b"\n")
    return json.loads(msg)

def write(tn: Telnet, msg: dict):
    tn.write(json.dumps(msg).encode() + b'\n')

def read_welcome_message(tn):
    welcome = read(tn)
    print(welcome.get('message'))

def generate_random_message(length):
    return os.urandom(length)

def solve():
    with Telnet(*HOST) as tn:
        read_welcome_message(tn)

        while True:
            # (xBalbinus): reference: [RFC 2104](https://datatracker.ietf.org/doc/html/rfc2104#autoid-2)
            # (1) append zeros to the end of K to create a B byte string
            # (e.g., if K is of length 20 bytes and B=64, then K will be
            # appended with 44 zero bytes 0x00) 
            nonce = os.urandom(65)  # Generate a 65-byte nonce

            # Convert bytes to hex for transmission
            nonce_1_hex = nonce.hex()
            nonce_2_hex = hashlib.sha256(nonce).hexdigest()

            message_1 = generate_random_message(4)
            message_2 = generate_random_message(4)

            message_1_hex = message_1.hex()
            message_2_hex = message_2.hex()

            write(tn, {
                'method': 'submit',
                'nonce_1': nonce_1_hex,
                'msg_1': message_1_hex,
                'nonce_2': nonce_2_hex,
                'msg_2': message_2_hex,
                'guess_key_2': 0
            })

            result = read(tn)
            print(result)

            if 'Invalid' not in result.get('message', ''):
                for guess_key_2 in range(22194):
                    write(tn, {
                        'method': 'submit',
                        'nonce_1': nonce_1_hex,
                        'msg_1': message_1_hex,
                        'nonce_2': nonce_2_hex,
                        'msg_2': message_2_hex,
                        'guess_key_2': guess_key_2
                    })

                    result = read(tn)
                    print(result)

                    if 'hint' not in result.get('message', ''):
                        return


if __name__ == "__main__":
    solve()
