# syntax=docker/dockerfile:1.5.2
FROM	mirror.gcr.io/python:3.10-bullseye
SHELL	["/bin/sh", "-e", "-c"]
RUN	rm -f /etc/apt/apt.conf.d/docker-clean && echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' >/etc/apt/apt.conf.d/keep-cache
ENV	DEBIAN_FRONTEND=noninteractive

RUN	--mount=type=cache,target=/var/cache/apt,sharing=locked \
	--mount=type=cache,target=/var/lib/apt,sharing=locked \
<<-EOF
	apt update
	apt install -y socat
EOF

WORKDIR	/usr/src/app

COPY	--chmod=004 winternitz.py server_config.py ./

EXPOSE	1337

# Define the command to run socat
ENTRYPOINT	["socat", "TCP4-LISTEN:1337,reuseaddr,fork", "EXEC:python3 winternitz.py"]
