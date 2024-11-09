#!/usr/bin/env python

from pwn import *

from time import sleep, time
from datetime import datetime, timedelta
import json
import hpke
from cryptography.hazmat.primitives.serialization import PublicFormat, Encoding
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from binascii import hexlify, unhexlify
from sys import stderr


K = 4
suite = hpke.Suite__DHKEM_P256_HKDF_SHA256__HKDF_SHA256__ChaCha20Poly1305


def fmt(data):
    return hexlify(data).decode()


def ufmt(data):
    return unhexlify(data.encode())


def send(conn, t, msg):
    conn.sendline(json.dumps({"type": "write", "target": t, "msg": msg}).encode())


def send_alice(conn, msg):
    send(conn, "alice", msg)


def send_bob(conn, msg):
    send(conn, "bob", msg)


def recv(conn, t):
    conn.sendline(json.dumps({"type": "read", "target": t}).encode())
    msg = conn.recvline(keepends=False)
    if msg == b"none":
        return None
    return msg


def recv_blocking(conn, t):
    msg = None
    while msg is None:
        msg = recv(conn, t)
    return msg


def recv_alice(conn):
    return recv_blocking(conn, "alice")


def recv_bob(conn):
    return recv_blocking(conn, "bob")


def main():
    host, port = args.HOST or 'localhost', int(args.PORT or 7331)

    # gen our key early
    ske = suite.KEM.generate_private_key()
    pke = ske.public_key().public_bytes(
        encoding=Encoding.X962, format=PublicFormat.UncompressedPoint
    )

    # we need to find these
    x1, x2 = None, None

    # start the task
    conn = remote(host, port)
    welcome = conn.recvline(keepends=False).decode()
    start_time = datetime.strptime(" ".join(welcome.split(" ")[2:4]), "%Y-%m-%d %H:%M:%S.%f")
    nearest_leap_second = datetime.strptime(
        "1990-12-31 23:59:59.000000", "%Y-%m-%d %H:%M:%S.%f"
    )

    # with the wait_time below Alice would start her time measurement exactly at the leap second
    wait_time = nearest_leap_second - start_time - timedelta(seconds=(K))

    # but we want Alice to start the measurement slightly earlier to mitigate network jitter
    # and to avoid get_time's strptime to crash on the "59:60" second   
    # if the solver fails repeatedly, tweak the timedelta below
    wait_time = wait_time - timedelta(seconds=(K//2 - 1))

    wait_time = wait_time.total_seconds()

    # sometimes we are out of luck and the task cannot be solved
    if wait_time < 0:
        print("Cannot solve this instance of the task, rerun the solver")
        return

    # the solution is to start at the right time
    print(f"waiting {wait_time} seconds", file=stderr)
    sleep(wait_time)

    send_bob(conn, "start")
    send_alice(conn, "start")

    # get c1 and m1 from alice
    c1 = recv_alice(conn).decode()
    # print("received c1 from alice", c1)
    m1_sig = recv_alice(conn).decode()
    # print("received m1_sig from alice", m1_sig)

    # alice starts measuring time from this point
    # we want leap second to occur between here and stop of measurement
    alice_start_time = time()

    # contruct new message for bob
    m1 = json.loads(json.loads(m1_sig)["m1"])
    m1_fake = json.dumps({"x1": m1["x1"], "n1": "41", "pka": fmt(pke)})
    x1 = m1["x1"]

    c1_d = hashes.Hash(hashes.SHA3_256())
    c1_d.update(m1_fake.encode())
    c1_fake = c1_d.finalize()

    # print("sending c1 to bob", c1_fake)
    send_bob(conn, fmt(c1_fake))

    s1_fake = ske.sign(m1_fake.encode(), ec.ECDSA(hashes.SHA3_256()))
    m1_fake_sig = json.dumps({"m1": m1_fake, "s1": fmt(s1_fake)})
    # print("sending m1_sig to bob", m1_fake_sig)
    send_bob(conn, m1_fake_sig)

    # getting encrypted m2 from bob
    m2_enc = json.loads(recv_bob(conn).decode())
    # print("received m2_enc from bob", m2_enc)

    encap, ct, pkb = ufmt(m2_enc["encap"]), ufmt(m2_enc["ct"]), ufmt(m2_enc["pkb"])
    pkb_k = ec.EllipticCurvePublicKey.from_encoded_point(suite.KEM.CURVE, pkb)
    m2 = suite.open_auth(
        encap,
        ske,
        pkb_k,
        info=b"interlock",
        aad=pkb,
        ciphertext=ct,
    )
    m2 = json.loads(m2)
    x2 = m2["x2"]

    # construct new msg for alice
    pka_k = ec.EllipticCurvePublicKey.from_encoded_point(
        suite.KEM.CURVE, ufmt(m1["pka"])
    )
    m2_fake = json.dumps(
        {
            "x2": x2,
            "pkb": fmt(pke),
            "pka": m1["pka"],
            "m1": json.loads(m1_sig)["m1"],
            "n2": "42",
        }
    )
    encap, ct = suite.seal_auth(
        pka_k, ske, info=b"interlock", aad=pke, message=m2_fake.encode()
    )
    m2_fake_enc = json.dumps({"encap": fmt(encap), "ct": fmt(ct), "pkb": fmt(pke)})

    # print("sending m2_enc to alice", m2_fake_enc)
    send_alice(conn, m2_fake_enc)

    # stop measurement
    # should be slightly more than K seconds
    alice_measurement = time() - alice_start_time
    # print("alice_measurement", alice_measurement)

    # check optional alice's errors
    # should be 'ERROR: too late' for normal MITM attempt
    maybe_error = recv(conn, "alice")
    # print("maybe_error", maybe_error)
    if maybe_error and maybe_error.startswith(b"ERROR"):
        print("Failed attack! Solver is not working")
        return

    conn.sendline(json.dumps({"type": "quit"}).encode())
    # print(conn.recvline_startswith(b"Communication"))

    conn.recvuntil(b"Give me x1: ")
    conn.sendline(x1.encode())

    conn.recvuntil(b"Give me x2: ")
    conn.sendline(x2.encode())

    flag = conn.recvline().decode()
    conn.close()
    print(flag)


if __name__ == "__main__":
    main()
