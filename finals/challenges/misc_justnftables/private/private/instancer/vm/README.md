How to run "remote" version
```
nix run .#vm
```

Alternative run
```
nix build .#vm
./result/bin/run
```

How to run debug version
```
nix run .#vmDebug
```

I don't have nix:
```
# If you are using Docker on macOS, you need to load certain kernel modules inside the Docker-VM. 
# You can do this with the following command:
docker run --rm -it --privileged --pid=host debian nsenter -t 1 -m -u -n -i sh

modprobe vsock
modprobe vhost_vsock

# Disable seccomp due to containerd 'issue': https://github.com/containerd/containerd/issues/7442
docker run \
    --rm \
    --security-opt seccomp=unconfined \
    --device /dev/vsock \
    --device /dev/vhost-vsock \
    -v $(pwd):/work \
    -w /work \
    -it nixos/nix bash -c 'nix --extra-experimental-features "nix-command flakes" run .#vm'
```