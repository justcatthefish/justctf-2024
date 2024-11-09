FROM golang:1.22-alpine as builder_manager
WORKDIR /code/
COPY . .
RUN CGO_ENABLED=0 go build -o manager main.go

FROM ubuntu:24.04
RUN apt-get update -y && apt-get install -y wget curl unzip

# install docker client only
ENV DOCKERVERSION=23.0.1
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKERVERSION}.tgz \
  && tar xzvf docker-${DOCKERVERSION}.tgz --strip 1 -C /usr/local/bin docker/docker \
  && rm docker-${DOCKERVERSION}.tgz

WORKDIR /work
COPY --from=builder_manager /code/manager manager
COPY run-chall.sh /work/run-chall.sh
COPY kill-allchall.sh /work/kill-allchall.sh
COPY kill-chall.sh /work/kill-chall.sh

USER root
CMD ["/work/manager"]
