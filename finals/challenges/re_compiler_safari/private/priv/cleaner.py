import sys

flag = b'justCTF{0bscur3_r1sc5_d1s4sm_sk1llz_++}'
reda = b'justWTF{**HERE WILL BE THE REAL FLAG**}'

src, dst = sys.argv[1], sys.argv[2]

with open(src, 'rb') as f:
    data = bytearray(f.read())

with open(dst, 'wb') as f:
    f.write(data.replace(flag, reda))
