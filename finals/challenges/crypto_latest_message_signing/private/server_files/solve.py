import json
from hashlib import sha256, sha1
from telnetlib import Telnet

from winternitz import prehash, ots_hash, HASH_LEN

HOST = ("localhost", 1337)

def read(tn: Telnet) -> dict:
    msg = tn.read_until(b"\n")
    print(msg)
    return json.loads(msg)

def write(tn: Telnet, msg: dict):
    print(msg)
    tn.write(json.dumps(msg).encode() + b'\n')

def offsets(source, target):
    src_hash = prehash(source)
    target_hash = prehash(target)
    diffs = list(zip(src_hash, target_hash))
    if all(t >= s for s, t in diffs):
        return diffs
    return None


def collide_prehash():
    diffs = None
    i = 0
    while diffs is None:
        i += 1
        src = json.dumps({"admin": False, "i": i})
        target = json.dumps({"admin": True, "i": i})
        diffs = offsets(src.encode(), target.encode())
    return i, diffs

def append_diffs(ots_sig, diffs):
    for i, (s, t) in enumerate(diffs):
        x = ots_sig[i*HASH_LEN:(i+1)*HASH_LEN]
        for j in range(s, t):
            x = ots_hash(x, j)
        ots_sig[i*HASH_LEN:(i+1)*HASH_LEN] = x


def solve():
    i, diffs = collide_prehash()
    c = Telnet(*HOST)
    _ = read(c)
    write(c, {"method": "sign", "message": json.dumps({"admin": False, "i": i})})
    sig = bytearray.fromhex(read(c)["signature"])
    append_diffs(sig, diffs)
    write(c, {"method": "get_flag", "message": json.dumps({"admin": True, "i": i}), "signature": sig.hex()})
    return read(c)
    

if __name__ == "__main__":
    print(solve())