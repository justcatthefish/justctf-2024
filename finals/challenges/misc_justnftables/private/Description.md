The challenge is only about bypassing firewall.

Startup Hint:  
Instead of running everything in QEMU, you can use Docker on your host machine.
QEMU is just a sandbox to not break the host system, but it's not required.
You don’t need to rewrite `/init`; you can simply extract the Docker commands
from the QEMU setup and run them directly with your own images.

Author: Cypis

```
nc justnftables.nc.jctf.pro 1337
# or
socat $(tty),raw,echo=0 tcp-connect:justnftables.nc.jctf.pro:1337
```
