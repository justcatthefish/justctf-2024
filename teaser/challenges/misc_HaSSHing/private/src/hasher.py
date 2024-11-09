from binascii import hexlify
from Crypto.Hash import SHA3_512


def pw_encoder(pw: str, loop):
    l = []
    for i in range(len(pw)):
        step_a = pw[: i + 1].encode()
        l.append(hexlify(loop(step_a)).decode("utf-8"))
    print(f"{','.join(l)}")


def optimized_sha512_loop(data: bytes, _iterations=1):
    salt = b"suchfast"
    h = SHA3_512.new()
    h.update(salt)
    h.update(data)
    return h.digest()


ITERATIONS = 300_000


def sha512_loop(data: bytes, iterations=ITERATIONS):
    contents = data
    for _ in range(iterations):
        h = SHA3_512.new()
        h.update(contents)
        contents = h.digest()
    return contents


if __name__ == "__main__":
    flag = input("Flag to hash: ").strip()
    optimized = input("Optimized (Y) or real (N)?: ").strip().upper() == "Y"

    pw_encoder(flag, optimized_sha512_loop if optimized else sha512_loop)
