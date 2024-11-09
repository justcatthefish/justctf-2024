FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && apt install -y curl wget xz-utils sudo coreutils

RUN apt update && apt install -y python3.10 python3-pip python3-paramiko socat
RUN pip3 install cryptography==42.0.8 pycryptodome==3.20.0
RUN mkdir /src


WORKDIR /src
