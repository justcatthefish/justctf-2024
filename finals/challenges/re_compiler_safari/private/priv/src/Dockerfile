FROM ubuntu:24.04 AS builder-base

RUN apt-get update && apt-get install -y \
    make \
    git \
    wget \
    bzip2 \
    just \
    qemu-user-static

RUN wget https://toolchains.bootlin.com/downloads/releases/toolchains/riscv64/tarballs/riscv64--musl--bleeding-edge-2020.08-1.tar.bz2 && \
    tar xvf riscv64--musl--bleeding-edge-2020.08-1.tar.bz2 -C /opt/ && \
    rm riscv64--musl--bleeding-edge-2020.08-1.tar.bz2
ENV PATH="$PATH:/opt/riscv64--musl--bleeding-edge-2020.08-1/bin"

RUN wget https://launchpad.net/~kflarsen/+archive/ubuntu/mosml/+files/mosml_2.10.2-0ubuntu0_amd64.deb && \
    apt-get install ./mosml_2.10.2-0ubuntu0_amd64.deb && \
    rm mosml_2.10.2-0ubuntu0_amd64.deb

RUN wget http://ftp.us.debian.org/debian/pool/main/e/elfkickers/elfkickers_0+git20240221+ds-5_amd64.deb && \
    apt-get install ./elfkickers_0+git20240221+ds-5_amd64.deb && \
    rm elfkickers_0+git20240221+ds-5_amd64.deb

RUN cd /opt && \
    git clone --depth=1 https://github.com/ffiori/tiger-compiler.git && \
    cd tiger-compiler/src && \
    make && \
    ln -s $PWD/tiger /usr/local/bin/tiger && \
    ln -s $PWD/runtime.c /usr/local/bin/runtime.c

WORKDIR /app/


FROM builder-base AS builder

COPY . .

RUN just compile


FROM ubuntu:24.04 AS runner

RUN apt-get update && apt-get install -y \
    qemu-user-static

COPY --from=builder /app/challenge /jailed/challenge

CMD ["/usr/bin/qemu-riscv64-static", "/jailed/challenge"]
