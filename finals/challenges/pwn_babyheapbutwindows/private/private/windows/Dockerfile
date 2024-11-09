FROM ubuntu:24.04
RUN apt update -y && apt install -y docker.io socat wget

WORKDIR /
COPY windows_vm_sparse.tar .
RUN tar -xvSf /windows_vm_sparse.tar && rm windows_vm_sparse.tar

WORKDIR /work
COPY image.tar .
COPY start.sh .

CMD ["/work/start.sh"]
