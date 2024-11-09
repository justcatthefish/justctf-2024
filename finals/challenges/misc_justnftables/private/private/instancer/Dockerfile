FROM nixos/nix
RUN echo "experimental-features = nix-command flakes" >> /etc/nix/nix.conf

WORKDIR /work
COPY main.go .
RUN nix-shell -p go --run 'go build -o main main.go'

WORKDIR /vm
COPY ./vm/ .
RUN nix build .#vm

CMD [ "/work/main" ]
