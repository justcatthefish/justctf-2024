{
  description = "vm";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";

  outputs = { self, nixpkgs }:
    let
      lib = nixpkgs.lib;
      mkVM = system: enableDebug: (let
        pkgsNative = nixpkgs.legacyPackages.${system};
        pkgsVM = nixpkgs.legacyPackages."x86_64-linux";

        kernel = pkgsVM.linuxPackages_latest.kernel;
        kernelCmdline = [
          "net.ifnames=0"
          "panic=1"
          "oops=panic"
          "console=ttyS0"
        ] ++ lib.optionals (!enableDebug) [ "quiet" ]
          ++ lib.optionals enableDebug [ "loglevel=7" ];

        requiredModules = [
          "virtio_pci"
          "virtio_mmio"
          "virtio_blk"
          "virtio_balloon"
          "virtio_rng"
          "virtio_net"
          "vmw_vsock_virtio_transport"
        ];

        rootfs = pkgsNative.buildEnv {
          name = "rootfs-env";
          paths = map lib.getBin [
            pkgsVM.pkgsStatic.busybox
            pkgsVM.kmod
            pkgsVM.socat
            pkgsVM.dhcpcd
            pkgsVM.docker
          ];
          pathsToLink = ["/bin" "/sbin"];
        };

        flagApp = pkgsNative.runCommand "flag-app" {
          nativeBuildInputs = [
            pkgsNative.go
            pkgsNative.nukeReferences
          ];
        } ''
          export HOME=$(mktemp -d)
          export CGO_ENABLED=0
          export GOOS=linux
          export GOARCH=amd64

          go build -o flag-app ${./flag-app/main.go}

          install -Dm755 flag-app $out/bin/flag-app
          nuke-refs $out/bin/flag-app
        '';

        flagAppWithNft = pkgsNative.writeScript "flag-app-with-nft" ''
          #! /bin/sh -e
          export PATH=${lib.makeBinPath [ pkgsVM.nftables ]}:$PATH
          exec ${flagApp}/bin/flag-app "$@"
        '';

        # your image has:
        # - zig (he can compile like: gcc/clang)
        # - python (ipython, requests, scapy)
        # - tcpdump
        # - nftables
        # - nettools
        defaultImageEnv = pkgsNative.buildEnv {
          name = "image-env";
          paths = map lib.getBin [
            pkgsVM.pkgsStatic.busybox
            pkgsVM.nettools
            pkgsVM.nftables
            pkgsVM.zig
            pkgsVM.tcpdump
            (let
              pythonPath = pkgsVM.python3.pkgs.makePythonPath [
                pkgsVM.python3.pkgs.ipython
                pkgsVM.python3.pkgs.requests
                pkgsVM.python3.pkgs.scapy
              ];
            in pkgsNative.writeScriptBin "ipython" ''
              #! /bin/sh -e
              export PYTHONPATH=${pythonPath}
              exec ${pkgsVM.python3}/bin/python3 -m IPython "$@"
            '')
          ];
          pathsToLink = ["/bin" "/sbin"];
        };

        startUserContainer = pkgsNative.writeScript "start-user-container" ''
          #! /bin/sh -e
          stty echo
          echo "Starting your image..."

          exec docker run --pull=never \
            --rm \
            --network br_docker \
            --cap-add CAP_NET_ADMIN \
            --cap-add CAP_NET_RAW \
            --tmpfs /tmp \
            -v /nix:/nix:ro \
            -v ${defaultImageEnv}/bin:/bin:ro \
            -v ${defaultImageEnv}/sbin:/sbin:ro \
            -e PATH=/bin:/sbin \
            --entrypoint /bin/sh \
            -it scratch
        '';

        init = pkgsNative.writeScript "init" ''
          #! /bin/ash -e

          export PATH=/bin:/sbin
          mkdir -p /proc /sys /dev
          mount -t proc none /proc
          mount -t sysfs none /sys
          mount -t devtmpfs devtmpfs /dev
          ln -s /proc/self/fd /dev/fd
          ln -s /proc/self/fd/0 /dev/stdin
          ln -s /proc/self/fd/1 /dev/stdout
          ln -s /proc/self/fd/2 /dev/stderr
          ${lib.optionalString enableDebug "ln -sf /dev/ttyS0 /dev/stdout"}
          ${lib.optionalString enableDebug "ln -sf /dev/ttyS0 /dev/stderr"}

          echo 1 > /proc/sys/vm/panic_on_oom

          mkdir -p /etc
          echo -n > /etc/fstab

          echo "loading kernel modules..."
          for i in ${toString requiredModules}; do
            modprobe $i || echo "warning: unable to load $i"
          done

          mkdir -p /dev/pts /dev/shm /tmp /run /var
          mount -t cgroup2 none /sys/fs/cgroup
          mount -t devpts none /dev/pts
          mount -t tmpfs -o "mode=1777" none /dev/shm
          mount -t tmpfs -o "mode=1777" none /var
          mount -t tmpfs -o "mode=1777" none /tmp
          mount -t tmpfs -o "mode=755" none /run
          ln -sfn /run /var/run

          ln -sf /proc/mounts /etc/mtab
          echo "127.0.0.1 localhost" > /etc/hosts
          echo "nameserver 127.0.0.1" > /etc/resolv.conf
          echo "root:x:0:0::/root:/bin/sh" > /etc/passwd

          mkdir -p /etc/ssl/certs
          ln -s ${pkgsVM.cacert.out}/etc/ssl/certs/ca-bundle.crt /etc/ssl/certs/ca-bundle.crt

          ifconfig lo up
          ifconfig eth0 up
          dhcpcd eth0

          echo "starting chall"
          DOCKER_RAMDISK=1 dockerd --iptables=False --ip6tables=False --bridge=none &

          max_retries=60
          retry_count=0
          while [ $retry_count -lt $max_retries ]; do
            if docker ps; then
              break
            fi
            retry_count=1
            sleep 1
          done

          docker load -i ${./scratch.tar}

          docker network create -d macvlan \
            --subnet=192.168.0.0/16 \
            --gateway=192.168.255.254 \
            -o parent=eth0.1337 br_docker

          # start flag-app
          mkdir /flag
          mv ${./flag.txt} /flag/flag.txt

          docker run -d --pull=never \
            --rm \
            --name flag-app \
            --ip 192.168.0.1 \
            -e FLAG=$(cat /flag/flag.txt) \
            --network br_docker \
            --cap-add CAP_NET_ADMIN \
            --cap-add CAP_NET_RAW \
            -v /bin:/bin:ro \
            -v /nix:/nix:ro \
            scratch ${flagAppWithNft}

          # start user container
          ${lib.optionalString enableDebug "setsid cttyhack /bin/sh"}
          socat VSOCK-LISTEN:9000 EXEC:"${startUserContainer}",pty,stderr,echo=0
        '';

        initrd = pkgsNative.makeInitrd {
          makeUInitrd = false;
          compressor = "zstd";
          contents = [
            {
              object = init;
              symlink = "/init";
            }
            {
              object = rootfs + "/bin";
              symlink = "/bin";
            }
            {
              object = rootfs + "/sbin";
              symlink = "/sbin";
            }
            {
              object = kernel + "/lib";
              symlink = "/lib";
            }
          ];
        };

        run_qemu = pkgsNative.writeShellScriptBin "run" (''
          CID=0
          while [ "$CID" -lt 3 ]; do
            CID=$SRANDOM
          done

          exitf() {
            kill -9 $QEMU_PID 2>/dev/null || true
          }
          trap exitf SIGINT SIGTERM
          trap exitf EXIT

          echo -ne 'The VM will be up in a few minutes (1-3 minutes). Please be patient.\n\r\n'

          ${pkgsNative.qemu}/bin/qemu-system-x86_64 \
            -cpu max \
            -name chall \
            -m 6G \
            -smp 1 \
            -nographic \
            -no-reboot ${lib.optionalString (!enableDebug) "-monitor /dev/null -device vhost-vsock-pci,guest-cid=$CID"} \
            -device virtio-rng-pci \
            -nic user,model=virtio-net-pci \
            -kernel ${kernel}/bzImage \
            -initrd ${initrd}/initrd.zst \
            -append "${toString kernelCmdline}" ${lib.optionalString (!enableDebug) "</dev/null >&2 >/dev/null &"}
          QEMU_PID=$!

        '' + lib.optionalString (!enableDebug) ''
          # Redirect the input to the VM
          ${pkgsNative.socat}/bin/socat stdio vsock-connect:$CID:9000,retry=180,interval=1
        '');
      in run_qemu);

      forAllSystems = lib.genAttrs lib.systems.flakeExposed;
    in
  {
    packages = forAllSystems (system: {
      # vmDebug is only working case for macos, because qemu on 🍎apfel system don't have VSOCK
      vmDebug = mkVM system true;

      # Used on remote chall
      vm = mkVM system false;
    });
    apps = forAllSystems (system: {
      vmDebug = {
        type = "app";
        program = "${self.packages.${system}.vmDebug}/bin/run";
      };
      vm = {
        type = "app";
        program = "${self.packages.${system}.vm}/bin/run";
      };
    });
  };
}