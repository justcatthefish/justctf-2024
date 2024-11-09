#!/usr/bin/env python

from pwn import *
from itertools import count

host, port = args.HOST or 'localhost', int(args.PORT or 1337)

p = remote(host, port)

def encrypt(suffix):
    p.sendline(suffix.hex().encode())
    return bytes.fromhex(p.recvline().decode())

# Find modlen (len(plaintext) % 16) using bug in the padding:

# The bug is that there is no padding added if plaintext is divisble by 16.

ct = encrypt(b"")
pad_len = 0

# Guess what padding is being used:
for val in range(1, 16):
    if encrypt(bytes([val]) * val) == ct:
        pad_len = val
        break

modlen = (16 - pad_len) % 16

# Recover flag:

# Try to guess the letter, append it multiple times and check
# if its occurences where "eaten" by the while loop from the challenge.

rflag = bytearray()

while not bytes(reversed(rflag)).startswith(b'justCTF{'):
    pad_len = -((modlen - len(rflag) + 1)) % 16
    for mult in count(2, step=2):
        batch = []

        for quess in range(256):
            suffix = rflag + bytes([quess]) * (pad_len + 1)
            padding = bytes([mult]) * (mult)
            batch.append(suffix.hex())
            batch.append((suffix + padding).hex())

        for line in batch:
            p.sendline(line.encode())

        found = False
        for quess in range(256):
            suf = bytes.fromhex(p.recvline().decode())
            suf_pad = bytes.fromhex(p.recvline().decode())
            if suf == suf_pad:
                found = True
                rflag.extend([quess] * (mult // 2))

        if not found:
            continue
        break

print(bytes(reversed(rflag)).decode())
