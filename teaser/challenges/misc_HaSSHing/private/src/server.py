#!/usr/bin/env python3

# Copyright (C) 2003-2007  Robey Pointer <robeypointer@gmail.com>
#
# This file is part of paramiko.
#
# Paramiko is free software; you can redistribute it and/or modify it under the
# terms of the GNU Lesser General Public License as published by the Free
# Software Foundation; either version 2.1 of the License, or (at your option)
# any later version.
#
# Paramiko is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
# details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with Paramiko; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301 USA.

import datetime
import hmac
from binascii import hexlify, unhexlify
import os
import socket
import sys
import threading
import time
import traceback
from typing import List

import paramiko

from Crypto.Hash import SHA3_512
import paramiko.server


# setup logging
host_key = paramiko.RSAKey(filename="test_rsa.key")
# host_key = paramiko.DSSKey(filename='test_dss.key')

DEFAULT_PW = "7401c613a0662c2cd2f2ae7d0fcae39fbbe4eee3c28c86fa80f5bfa2ade08b7aa4875ff1ad5a4ecef76702d499f17cc4a69577a5e1df1f4ba4092a1d81e85a61,1700838e75419d3d3ee7883435fb43a791aed80978c61dbe89c76076d7220c9749a7b23dbf77811489886730ce043ca1e5eaf9dbc6df9a2fa49a603a88e6cd5b,ab38a2575c63580ad80371940d3589e5e9b36606355e8fdb18a7e591c8afc8dc7d0e382f1136b711fe8bc971da0088cbf6f89ac6a22652fa387f207e854c334c,919471883dd29d14090a2b8481b7f2c0560c5f161ab82d4e838551225dc49aa77f7cd1da7a1e1f652344afc56dd9a516399292551eb67487c2cd930653b84f32,a3c5dfe381a68eba84a2e465edf186dbd360b1853d5d1321fc3f3174739a40ed71d7ea50fb96a85061316f0a9ec139ea3eccf4ebe960381d0ea05e3da0bba680,847e8de2ec84b91e2219e039473ec8d0e3ce60fbbab0cd1eb1edaa2c790e1a5f656a43fea8b9305f93e03d12b76684a4f7ad3316175f5c466fcfadc7d9aa6e16,872e93d553d6e81ccafc93687b8d1e12a802cffe7239f8dd54ffeb186d699df1720a83d27ef4af1b455b28c31846f95db486b0e7753397fcc07dcb534615d37b,357e997780ad68fec40fbb0df1cbfdbe3cc98914a4b9e483cc6c9d11fa00ca2d6525100d26b92b099f7ddb77ddfb8650eeb10a25897a69686ce752ebac073bbb,ecc79f25c9ddaa2aecee1ac8106751184b27bd8839dd407f7a7530104d95d9f96c39133399e4f6824b648ce4e02f8067bb9aad0b05ba1c9bc1cdebf81e73e67d,4c6d4dc099a7e7d439d8550767b1f795fd5c8bfd97733312e0f60d413e8ab09995472daf469c46175e6c94d6423ff47eb45f7be2c080f1fc7c744df18fbbd5d0,0eb96a79dff1cb2090c3c854c84aef788b3c61d60818641dbb5335f2366d95d74c6f4be5ba56531c7e5ee38d4d6589de59a4c69258b749f0026653a2a1428a58,017f32a99ec12e9bd12c6e4cbd15158633c1513258e1e309adcc5e4da75f1112abf9d9f29187d44fac18e5a958a6d44a92b11c26e8f63f5500627ffad97a7421,d899c75098fc98501ea36a98cdfb7847ddc5f5bddbd5afce0f0995b9d1402067a995d2a542db2ab96bbef8e1ef659e5e45f3a1bfcb1ab83fe50c9845b7b4826e,414a384aacebd259d3e237e64646257acb0145f8fe6c411c9766f48c478c295504dcc58d0af3033bbd4982b859901ecafe8642cc9267ccfe46efe6841452a57a,e4e92cb11795791c0879cc960cca709d3c9c8c3713b4ebc99c33670654ee5f8916a28e4e32dd546aa3b5995f3ecd7da2c31d4c43b0cc38de339bf53bd64613de,0286504f5cb1eb397d92102718c54520d47e9666aec1b83122742e94d592cc9e3c5143ab168ebc9d12dccc32ebd820648e163f2a598ab08fb07528b883d4d1bf,72f2a80155f5324d19d3c41f60de15d0acd012b1c3fc2e3ebc33382ed5c205784d90d8e1694127f0e7cbc75f952ceabb64dc8791ef57929ce9653bd008fbf400,94f0a385c0c33b0961face813c6e979f31f3e3dc10b7c61f7fd1e23b51b207af91085a92facbf9ca20b4059266a21219f522f7a2f36ec1e45c8c1cdc0cac6e5a,65435ed6dd75128bbc4cda3bc33e2121f79340ef2be2ea5316220a764e5b4a8db1ef918a82a33a99f5b4361373d579727f58c38a297ffdd72ab7b97d7bd9b918,4f415c4cfdcc286f6197156fb5e68c07e4a3f1b32d4672be4f80f969461f26e81074001da7d48524fb7fa5adf8a1e20b776884998890225c8aa98c6bca8ae425,009dd00ca5c24f4bf048cfc5ef8bf256abc6c473dc2bebfb087aa41a6e3434de6d581c627beddb651ef367acc1f333a1e788121f55f02fa22257e16512f6e8e5,7713c792b314162b3dd9571a45291a66693b28339ac2a6a8c3dea57db913bd5a674747d9eac251ee597d536fd1a4736e7cc7dbcc037e820bb126a3d5a00dc801,4cbf22d83d694db218a83d89ec3dd6d29ec507c509ef72e4f5cbfa66c4961c0027376c3b2250f39bcc780a45c47f7038744c91b7d63e2ccbf79804739019d071,a5831b590f504444e5cf52494eea36df3db99fe24531957853a4a4d34e3397b864c518839337b3c439a9423806c6a82f13b7b6a3a2fe5e46fff04e9a18dd879f,d6d7304c081d44add520e382d095864cd2d086ee2a7069c23909f094f2856ca9973b27fc0aa748fbca9a78abbb761203c94ecb391e8ca46b1f8b565151c62389,8a13a5bd2b2a3414edbb1df0f18a165595401e4ee869276f64cc2c0182c4b7e4ad31624c6e38cf3e6edcddb93c14fef62c76353f464ff1d080806f8a97d09f53,3bc03b040ffdb21a8eb2eb809d5bf9ce8b3bd84fc3d12bcf44d794bab609831d390ab271c42c114b2dd5c173dd9b0f03e68e929cf42a8a2505d12dcd16db17d6,e35bf9b2984582f634fed3f680d9243f1192e34d67def65d64f489de7f333121537e12099fcd733f2b04ba3af029762844ad2c72f65b8218259427a67e394ceb,8c761d67a2489c3701602780c9151f618b0c6c364cb43a4ba0ffa780412b028a504e93626224d49a0fcd2174640ff055dd51bc52b26f868d412a8941f079972b,2ffe4df0e2d3ed2b2c028981e81069c4f51ff820f5f11e014b23f8f7e600d22914a38c12375e02baa777af0863e5ae9176ee8432c4959a57d395953f62263231,b1a6eec7de688b29bfe0c611a3f5435ba1faa69a9763f32bce787d900153eb8c3167d7ce467db207d1071181035e99c12154267244f66f04d683bc0d4ce455e7"

LOGIN_USERNAME = os.getenv("CTF_USER", "ctf")
LOGIN_PASSWORD = list(
    map(unhexlify, os.getenv("CTF_PASS", DEFAULT_PW).strip().split(","))
)
LOGIN_FLAG = os.getenv("CTF_FLAG", "justCTF{s1d3ch4nn3ls_4tw_79828}")

ITERATIONS = 300_000


def sha512_loop(data: bytes, iterations=ITERATIONS):
    contents = data
    for _ in range(iterations):
        h = SHA3_512.new()
        h.update(contents)
        contents = h.digest()
    return contents


########### REMOVE ME BEFORE SHARING ########################
#############################################################

if LOGIN_FLAG != "justCTF{hi}":

    def optimized_sha512_loop(data: bytes, _iterations=1):
        salt = b"suchfast"
        import time

        time.sleep(0.05)
        h = SHA3_512.new()
        h.update(salt)
        h.update(data)
        return h.digest()

    sha512_loop = optimized_sha512_loop

########### END REMOVE ME BEFORE SHARING ####################
#############################################################


def uncollisionable_hash_equals(a: str, b: List[bytes]):
    for i in range(max(len(a), len(b))):
        step_a = a[: i + 1].encode()
        hash_a, hash_b = sha512_loop(step_a), b[min(i, len(b)-1)]
        if not hmac.compare_digest(hash_a, hash_b):
            return False
    return True


class Server(paramiko.ServerInterface):
    def __init__(self):
        self.event = threading.Event()

    def check_channel_request(self, kind, chanid):
        if kind == "session":
            return paramiko.OPEN_SUCCEEDED
        return paramiko.OPEN_FAILED_ADMINISTRATIVELY_PROHIBITED

    def check_auth_interactive(self, username, submethods):
        self.username = username
        return paramiko.server.InteractiveQuery(
            "[keyboard-interactive authentication mode]",
            f"Server time is {datetime.datetime.now()}",
            ("password: ", False),
        )

    def check_auth_interactive_response(self, responses):
        reception_time = f"{datetime.datetime.now()}"
        if (
            len(responses) == 1
            and self.check_auth_password(self.username, responses[0])
            == paramiko.AUTH_SUCCESSFUL
        ):
            return paramiko.AUTH_SUCCESSFUL

        return paramiko.server.InteractiveQuery(
            f"[{reception_time}] Checking password...",
            f"[{datetime.datetime.now()}] That wasn't it, sorry. Try again.",
            ("password: ", False),
        )

    def check_auth_password(self, username, password):
        try:
            if username != LOGIN_USERNAME:
                return paramiko.AUTH_FAILED

            if not uncollisionable_hash_equals(password, LOGIN_PASSWORD):
                return paramiko.AUTH_FAILED

            return paramiko.AUTH_SUCCESSFUL
        except Exception as e:
            return paramiko.AUTH_FAILED

    def check_auth_publickey(self, username, key):
        return paramiko.AUTH_FAILED

    def check_auth_gssapi_with_mic(
        self, username, gss_authenticated=paramiko.AUTH_FAILED, cc_file=None
    ):
        return paramiko.AUTH_FAILED

    def check_auth_gssapi_keyex(
        self, username, gss_authenticated=paramiko.AUTH_FAILED, cc_file=None
    ):
        return paramiko.AUTH_FAILED

    def enable_auth_gssapi(self):
        return False

    def get_allowed_auths(self, username):
        return "keyboard-interactive,password"

    def check_channel_shell_request(self, channel):
        self.event.set()
        return True

    def check_channel_pty_request(
        self, channel, term, width, height, pixelwidth, pixelheight, modes
    ):
        return True

    def get_banner(self):
        return (
            "Hello player!\r\n\r\nGood luck trying to get a hash collision!\r\n\r\n",
            "en-US",
        )

class DummySocket:
    def send(self, b: bytes) -> int:
        return sys.stdout.buffer.write(b)
    
    def recv(self, n: int) -> bytes:
        return sys.stdin.buffer.read(n)

    def close(self):
        sys.exit(1)

    def settimeout(self, n: float):
        pass

try:
    t = paramiko.Transport(DummySocket(), gss_kex=False)
    t.add_server_key(host_key)
    server = Server()
    try:
        t.start_server(server=server)
    except paramiko.SSHException:
        sys.exit(1)

    # wait for auth
    chan = t.accept(60)
    if chan is None:
        sys.exit(1)

    server.event.wait(10)
    if not server.event.is_set():
        sys.exit(1)

    chan.send("\r\nI hear you're worthy of a flag today! Enjoy!\r\n\r\n")
    chan.send(f"{LOGIN_FLAG}\r\n\r\n")
    time.sleep(15)
    chan.send("Bye!")
    chan.close()

except Exception as e:
    try:
        t.close()
    except:
        pass
    sys.exit(1)
