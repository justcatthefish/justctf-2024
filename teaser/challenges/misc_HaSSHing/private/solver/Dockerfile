FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

##################################### NSJAIL SETUP #####################################
# We install nsjail from nix package manager that we first install
# that is just easier lol
RUN apt update && apt install -y curl wget xz-utils sudo coreutils

RUN apt update && apt install -y python3.10 python3-pip python3-paramiko
RUN pip3 install paramiko==3.4.0 numpy==1.26.4

RUN mkdir /src


WORKDIR /src
