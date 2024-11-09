FROM alpine as builder1
RUN apk add zig
COPY build.zig main.zig .
RUN zig build

FROM alpine as builder2
RUN apk add wget
ARG VERSION=2024.08.29
RUN export ARCH=$([ "$(uname -m)" = "aarch64" ] && echo "arm64" || echo "amd64"); \
    wget -O pwndbg.deb \
    "https://github.com/pwndbg/pwndbg/releases/download/${VERSION}/pwndbg_${VERSION}_${ARCH}.deb"

FROM ubuntu:24.04
COPY --from=builder2 pwndbg.deb .
RUN apt install ./pwndbg.deb && rm pwndbg.deb
COPY --from=builder1 zig-out/bin/chall .
CMD ["./chall"]
