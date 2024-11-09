FROM ubuntu
FROM python:3.9

RUN apt update
RUN apt install -y \
    socat

RUN useradd -d /home/ctf/ -m -p ctf -s /bin/bash ctf
RUN echo "ctf:ctf" | chpasswd
WORKDIR /home/ctf
USER ctf

COPY ./chall.py /home/ctf

EXPOSE 3000
ENTRYPOINT socat tcp-l:3000,fork,reuseaddr exec:'python3 chall.py' && /bin/bash
