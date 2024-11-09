#!/usr/bin/env python


from subprocess import PIPE, Popen
from time import sleep
import threading
from datetime import datetime
from queue import Queue, Empty
import json
from sys import stderr
import hpke
from cryptography.hazmat.primitives.serialization import PublicFormat, Encoding
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
import os
from binascii import hexlify, unhexlify


FLAG = os.environ['FLAG'] if 'FLAG' in os.environ else 'justCTF{temporary-interlock-flag}'
K = 4
suite = hpke.Suite__DHKEM_P256_HKDF_SHA256__HKDF_SHA256__ChaCha20Poly1305

timer = Popen(["./timer"], stdin=PIPE, stdout=PIPE, bufsize=1, encoding="ascii")
timer_lock = threading.Lock()

alice_x1, alice_x2, bob_x1, bob_x2 = None, None, None, None


def get_time():
    timer_lock.acquire()
    try:
        timer.stdin.write("gettimeofday\n")
        t = timer.stdout.readline().strip()[:-3]
        return datetime.strptime(t, "%Y-%m-%d %H:%M:%S.%f")
    finally:
        timer_lock.release()


def fmt(data):
    return hexlify(data).decode()


def ufmt(data):
    return unhexlify(data.encode())


def alice(qr, qw, ev):
    try:
        alice_w(qr, qw)
    except Exception as e:
        ev.set()
        qr.put("ERROR")


def alice_w(qr, qw):
    global alice_x1, alice_x2
    msg = ""
    while msg != "start":
        msg = qw.get()

    ska = suite.KEM.generate_private_key()
    pka = ska.public_key().public_bytes(
        encoding=Encoding.X962, format=PublicFormat.UncompressedPoint
    )

    x1 = os.urandom(128)
    n1 = os.urandom(64)
    alice_x1 = x1

    m1 = json.dumps({"x1": fmt(x1), "n1": fmt(n1), "pka": fmt(pka)})
    c1_d = hashes.Hash(hashes.SHA3_256())
    c1_d.update(m1.encode())
    c1 = c1_d.finalize()

    qr.put(fmt(c1))

    sleep(K)

    s1 = ska.sign(m1.encode(), ec.ECDSA(hashes.SHA3_256()))
    m1_sig = json.dumps({"m1": m1, "s1": fmt(s1)})
    qr.put(m1_sig)

    start_time = get_time()
    m2_enc = json.loads(qw.get())
    stop_time = get_time()

    if (stop_time - start_time).total_seconds() >= K:
        raise Exception("too late")

    encap, ct, pkb = ufmt(m2_enc["encap"]), ufmt(m2_enc["ct"]), ufmt(m2_enc["pkb"])
    pkb_k = ec.EllipticCurvePublicKey.from_encoded_point(suite.KEM.CURVE, pkb)
    m2 = suite.open_auth(
        encap,
        ska,
        pkb_k,
        info=b"interlock",
        aad=pkb,
        ciphertext=ct,
    )
    m2 = json.loads(m2)
    if ufmt(m2["pka"]) != pka:
        raise Exception("wrong data")
    if m2["m1"] != m1:
        raise Exception("wrong data")

    x2 = ufmt(m2["x2"])
    alice_x2 = x2


def bob(qr, qw, ev):
    try:
        bob_w(qr, qw)
    except Exception as e:
        ev.set()
        qr.put("ERROR")


def bob_w(qr, qw):
    global bob_x1, bob_x2
    msg = ""
    while msg != "start":
        msg = qw.get()

    skb = suite.KEM.generate_private_key()
    pkb = skb.public_key().public_bytes(
        encoding=Encoding.X962, format=PublicFormat.UncompressedPoint
    )

    c1 = ufmt(qw.get())

    sleep(K)

    m1_sig = json.loads(qw.get())
    m1 = json.loads(m1_sig["m1"])
    s1 = ufmt(m1_sig["s1"])
    x1, n1, pka = ufmt(m1["x1"]), ufmt(m1["n1"]), ufmt(m1["pka"])
    bob_x1 = x1

    m1 = json.dumps({"x1": fmt(x1), "n1": fmt(n1), "pka": fmt(pka)})
    c1_d = hashes.Hash(hashes.SHA3_256())
    c1_d.update(m1.encode())
    if c1 != c1_d.finalize():
        raise Exception("wrong hash")

    pka_k = ec.EllipticCurvePublicKey.from_encoded_point(suite.KEM.CURVE, pka)
    pka_k.verify(s1, m1.encode(), ec.ECDSA(hashes.SHA3_256()))

    x2 = os.urandom(128)
    n2 = os.urandom(64)
    bob_x2 = x2

    m2 = json.dumps(
        {"x2": fmt(x2), "pka": fmt(pka), "m1": m1, "n2": fmt(n2)}
    )
    encap, ct = suite.seal_auth(
        pka_k, skb, info=b"interlock", aad=pkb, message=m2.encode()
    )
    m2_enc = json.dumps({"encap": fmt(encap), "ct": fmt(ct), "pkb": fmt(pkb)})
    qr.put(m2_enc)


def router(targets, aliceE, bobE):
    while True:
        if aliceE.is_set() or bobE.is_set():
            raise Exception("Communication error")

        data = input()
        data = json.loads(data)

        if not isinstance(data, dict):
            raise Exception("Communication error")

        if data.get("type") not in targets:
            raise Exception("Communication error")

        if data["type"] == "quit":
            return
        else:
            if data.get("target") not in targets[data["type"]]:
                raise Exception("Communication error")

            if data["type"] == "write":
                if "msg" not in data:
                    raise Exception("Communication error")
                targets[data["type"]][data["target"]].put(data["msg"])

            elif data["type"] == "read":
                try:
                    msg = targets[data["type"]][data["target"]].get(True, 1)
                    print(msg)
                except Empty:
                    print("none")


def main():
    aliceQW, bobQW = Queue(), Queue()
    aliceQR, bobQR = Queue(), Queue()
    aliceE, bobE = threading.Event(), threading.Event()
    aliceT, bobT = threading.Thread(
        target=alice, args=(aliceQR, aliceQW, aliceE)
    ), threading.Thread(target=bob, args=(bobQR, bobQW, bobE))
    targets = {
        "read": {"alice": aliceQR, "bob": bobQR},
        "write": {"alice": aliceQW, "bob": bobQW},
        "quit": None,
    }
    aliceT.start(), bobT.start()

    print(f"Welcome in {get_time()} at World Chess Championship!")

    try:
        router(targets, aliceE, bobE)
    except:
        print("Error")
        os._exit(1)

    aliceT.join(), bobT.join()
    timer.stdin.write("q\n")
    timer.communicate()

    if aliceE.is_set() or bobE.is_set():
        print("NOPE")
        return

    print("Communication established, check if MITM was successful")

    try:
        x1 = unhexlify(input("Give me x1: ").strip())
        x2 = unhexlify(input("Give me x2: ").strip())
    except:
        print("Error")
        return

    if x1 == alice_x1 == bob_x1:
        if x2 == alice_x2 == bob_x2:
            print(FLAG)
            return
    print("NOPE")


if __name__ == "__main__":
    main()
