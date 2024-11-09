### Compiler Safari
A comp-sci student built their own compiler from scratch and programmed a math game on its language. The result is a quirky binary hiding its secrets in layers of odd code. Your task: reverse-engineer the game binary, learn how to play the game, and win a round with the server to acquire the flag.

The server is on:
```
nc compiler-safari.nc.jctf.pro 20569
```

Note: The binary was written for RISC-V architecture (see `file compiler-safari`). You can run it on Linux using QEMU (Quick Emulator), e.g., on Ubuntu 24.04:

```
apt-get update && apt-get install -y qemu-user-static
qemu-riscv64-static ./compiler-safari
```

Authored by [elopez](https://github.com/elopez) from Trail of Bits



Attachments:
* [compiler-safari](./public/compiler-safari)