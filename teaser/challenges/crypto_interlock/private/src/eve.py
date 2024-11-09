#!/usr/bin/env python

from pwn import *
import json


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
    conn = remote("localhost", 7331)
    welcome = conn.recvline(keepends=False).decode()
    print(welcome)

    send_bob(conn, "start")
    send_alice(conn, "start")

    c1 = recv_alice(conn).decode()
    print("sending c1 to bob: ", c1)
    send_bob(conn, c1)

    m1_sig = recv_alice(conn).decode()
    print("sending m1_sig to bob: ", m1_sig)
    send_bob(conn, m1_sig)

    m2_enc = recv_bob(conn).decode()
    print("received m2_enc: ", m2_enc)

    send_alice(conn, m2_enc)
    print("sending m2_enc to alice")

    conn.sendline(json.dumps({"type": "quit"}).encode())

    print(conn.recvline_startswith(b"Communication"))

    conn.recvuntil(b"Give me x1: ")
    conn.sendline(b"41")

    conn.recvuntil(b"Give me x2: ")
    conn.sendline(b"4142")

    err = conn.recvline().strip()
    print(err)
    conn.close()
    assert err == b"NOPE", err


if __name__ == "__main__":
    main()
