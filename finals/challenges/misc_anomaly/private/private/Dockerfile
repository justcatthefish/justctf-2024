FROM ubuntu:latest

RUN apt-get update && apt-get install -y qemu-system-x86

COPY hdd.qcow2 /hdd.qcow2

ENTRYPOINT ["qemu-system-x86_64"]

CMD ["-m", "128M", \
     "-drive", "file=/hdd.qcow2,format=qcow2", \
     "-device", "e1000,netdev=net0", \
     "-netdev", "user,id=net0,hostfwd=tcp::2222-:22", \
     "-boot", "d", \
     "-nographic"]
