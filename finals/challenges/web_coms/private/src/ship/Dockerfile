FROM golang:1.23 AS builder
WORKDIR /src
COPY . .
ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64
RUN go build -o ship

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /src/ship /root/ship

RUN chmod +x /root/ship
CMD ["/root/ship"]
