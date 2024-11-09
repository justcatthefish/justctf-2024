#!/usr/bin/env python
# -*- coding: utf-8 -*-


import sys
import requests
import hashlib
from base64 import b64encode, b64decode

# pip install cryptography
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning) 


def impkey(key_pem):
    """
    Load private key from PEM string
    """
    loaded_private_key = serialization.load_pem_private_key(
        key_pem.encode(),
        password=None,
        backend=default_backend(),
        unsafe_skip_rsa_key_validation=True
    )
    public_key = loaded_private_key.public_key().public_bytes(
        serialization.Encoding.OpenSSH,
        serialization.PublicFormat.OpenSSH
    )
    return loaded_private_key, public_key


def genkey():
    """
    Generate signing key for use in GitHub and Trusted Blinding
    """
    key = rsa.generate_private_key(
        backend=default_backend(),
        public_exponent=65537,
        key_size=2048
    )

    private_key = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption()
    )

    public_key = key.public_key().public_bytes(
        serialization.Encoding.OpenSSH,
        serialization.PublicFormat.OpenSSH
    )

    print(f"Private Key:\n{private_key.decode('utf-8')}")
    print(f"Public Key:\n{public_key.decode('utf-8')}")
    return key, public_key


class Cli:
    def __init__(self, url, tls=True):
        self.url = url
        self.jwt = None
        self.tls = tls
        self.challenge = None
        self.difficulty = None

    def logged(func):
        def inner(self, *args, **kwargs):
            if not self.jwt:
                print("Login first")
                return
            return func(self, *args, **kwargs)
        return inner

    def public_access(self):
        return requests.get(self.url + '/api/read', verify=self.tls)

    def register(self, email, password):
        resp = requests.post(self.url + '/api/auth/signup', json={"email": email, "password": password}, verify=self.tls)
        try:
            data = resp.json()
            self.challenge = data["challenge"]
            self.difficulty = int(data["difficulty"])
        except Exception as e:
            print("Cannot singup", e)
        return resp

    @logged
    def verify(self):
        print(f"Veryfing with difficulty {self.difficulty}")
        zeros = '0' * self.difficulty

        def is_valid(digest):
            bits = ''.join(bin(i)[2:].zfill(8) for i in digest)
            return bits[:self.difficulty] == zeros

        i = 0
        while True:
            i += 1
            s = self.challenge + str(i)
            if is_valid(hashlib.sha256(s.encode()).digest()):
                print(f"Found answer {i}")
                break

        answer = str(i)
        return requests.post(self.url + '/api/auth/verify', headers={"x-access-token": self.jwt}, json={"answer": answer}, verify=self.tls)

    def login(self, email, password):
        resp = requests.post(self.url + '/api/auth/signin', json={"email": email, "password": password}, verify=self.tls)
        if resp.status_code == 200 and 'accessToken' in resp.json():
            self.jwt = resp.json()['accessToken']
        return resp

    @logged
    def destroy(self):
        return requests.post(self.url + '/api/auth/destroy', headers={"x-access-token": self.jwt}, verify=self.tls)

    @logged
    def blind_init(self, type=None):
        if type is not None:
            resp = requests.post(self.url + '/api/blind/init', headers={"x-access-token": self.jwt}, json={"type": type}, verify=self.tls)
        else:
            resp = requests.post(self.url + '/api/blind/init', headers={"x-access-token": self.jwt}, verify=self.tls)
        return resp

    @logged
    def blind_finalize(self, blinded_sign):
        return requests.post(self.url + '/api/blind/finalize', headers={"x-access-token": self.jwt}, json={
            "blindSignature": b64encode(blinded_sign).decode(),
        }, verify=self.tls)

    @logged
    def config_oidc(self, user, key):
        return requests.post(self.url + '/api/user/config', headers={"x-access-token": self.jwt}, json={
            "oidcUser": user,
            "oidcKey": key
        }, verify=self.tls)

    @logged
    def config_blind(self, rsa_variant):
        return requests.post(self.url + '/admin/config', headers={"x-access-token": self.jwt}, json={
            "rsaVariant": rsa_variant
        }, verify=self.tls)

    @logged
    def make_poem(self, poem):
        return requests.post(self.url + '/api/poem', headers={"x-access-token": self.jwt}, json={
            "poem": poem
        }, verify=self.tls)

    @logged
    def get_user(self):
        return requests.get(self.url + '/api/user', headers={"x-access-token": self.jwt}, verify=self.tls)


def rfc_blind_sign(sk, blinded_msg):
    d = sk.private_numbers().d
    pk = sk.public_key()
    n, e = pk.public_numbers().n, pk.public_numbers().e

    # m = bytes_to_int(blinded_msg)
    m = int.from_bytes(b64decode(blinded_msg), "big")

    # s = RSASP1(sk, m)
    s = pow(m, d, n)

    # mp = RSAVP1(pk, s)
    mp = pow(s, e, n)

    if m != mp:
        print("signing failure")
        return

    blind_sig = s.to_bytes((sk.key_size+7)//8, "big")
    return blind_sig


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python ./cli.py <addr> <user> <password>")
        sys.exit(1)

    URL = sys.argv[1]
    user, password = sys.argv[2], sys.argv[3]

    cli = Cli(URL)
    # cli.register(user, password)
    cli.login(user, password)
    # cli.verify()
