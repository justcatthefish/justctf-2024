t = open('sol.py').read().split('#')[0].replace('lambda ','L').replace(' ', '').replace('\n', '').replace('L', 'lambda ')
from pwn import*

conn = remote(args.HOST or '127.0.0.1', 20569)
conn.send(t.encode() + b'\n')
conn.interactive()
