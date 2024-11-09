FROM golang:1.22.5

RUN adduser --home /home/app nonroot
RUN chown -R nonroot:nonroot /home/app
WORKDIR /home/app
USER nonroot

# Download Go modules
COPY --chown=nonroot:nonroot go.mod ./
RUN go mod download

# Copy the source code
COPY --chown=nonroot:nonroot tls.go main.go ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /home/app/rev-proxy

# Run
CMD ["/home/app/rev-proxy"]