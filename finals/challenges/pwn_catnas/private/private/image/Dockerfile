FROM ubuntu:latest

RUN apt-get update && apt-get install -y qemu-system-arm

COPY zImage /zImage
COPY rootfs.cpio.gz /rootfs.cpio.gz

ENTRYPOINT ["qemu-system-arm"]

CMD ["-m", "128", \
     "-M", "virt,highmem=off", \
     "-kernel", "/zImage", \
     "-initrd", "/rootfs.cpio.gz", \
     "-device", "virtio-net-device,netdev=net0", \
     "-netdev", "user,id=net0,hostfwd=tcp:0.0.0.0:8000-:8000", \
     "-nographic", \
     "-append", "root=/dev/ram rdinit=/sbin/init console=/dev/null"]
