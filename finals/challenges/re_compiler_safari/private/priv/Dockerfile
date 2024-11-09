FROM	ubuntu:24.04 AS readflag

SHELL	["/bin/sh", "-e", "-c"]
RUN	rm -f /etc/apt/apt.conf.d/docker-clean && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache
ENV	DEBIAN_FRONTEND=noninteractive

FROM alpine@sha256:77726ef6b57ddf65bb551896826ec38bc3e53f75cdde31354fbffb4f25238ebd

##################################### NSJAIL SETUP #####################################
RUN apk add curl wget xz sudo coreutils qemu-system-riscv64

RUN wget https://releases.nixos.org/nix/nix-2.15.1/nix-2.15.1-x86_64-linux.tar.xz && \
    tar -xvf nix-2.15.1-x86_64-linux.tar.xz && \
    echo '9345c1485dadb1cb66ed54aa97c692ab38f7ead2d609230564e6673490f30365 nix-2.15.1-x86_64-linux.tar.xz' | sha256sum -c

RUN adduser --disabled-password --gecos '' nix && \
    adduser nix wheel && \
    echo '%wheel ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER nix
ENV USER=nix
RUN cd nix-2.15.1-x86_64-linux && \
    ./install --no-daemon

RUN . /home/nix/.nix-profile/etc/profile.d/nix.sh && \
    nix-env -iA nixpkgs.nsjail
COPY ./nsjail.cfg /nsjail.cfg

# Bring back root user
USER root
ENV USER=root

# Eventually, disable sudo
RUN sed -i '$ d' /etc/sudoers
############################# END OF NSJAIL SETUP #####################################
#RUN apk add python3
#RUN python -m venv /opt/venv
#ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /home/

RUN adduser --disabled-password --gecos '' jailed
RUN mkdir /jailed/

#RUN	adduser --disabled-password --gecos '' flag-owner
COPY	--chmod=0555 ./challenge /jailed/challenge

CMD ["/home/nix/.nix-profile/bin/nsjail", "--config", "/nsjail.cfg"]
