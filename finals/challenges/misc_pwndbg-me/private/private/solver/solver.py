from pwn import *

# context.log_level = 'DEBUG'
p = process('docker run -e FLAG=flaga --rm -i chall', shell=True)

# zig build
binary = open('./zig-out/bin/solver', 'rb').read()
print('len=', len(binary))

p.recvuntil(b'Please provide size in bytes: ', drop=True)
p.sendline(str(len(binary)).encode())

p.recvuntil(b'Please write your binary now\n', drop=True)
p.send(binary)

p.interactive()
