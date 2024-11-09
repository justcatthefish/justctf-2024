import json
from hashlib import sha256, sha1
from os import urandom
from server_config import FLAG

HASH_LEN = 20
OTS_SIG_LEN = HASH_LEN * HASH_LEN
K = 8


# Domain-separated hash function (need not be collision-resistant)
def domain_hash(*data):
    h = sha1()
    for item in data:
        h.update(len(item).to_bytes(4, 'big'))
        h.update(item)
    return h.digest()


def mt_hash(a, b):
    return domain_hash(b"MT", a, b)


def kdf_hash(seed, i):
    return domain_hash(b"KDF", seed, i.to_bytes(4, 'big'))


def ots_hash(v, i):
    return domain_hash(b"OTS", v, i.to_bytes(4, 'big'))


def leaf_hash(l):
    return domain_hash(b"LEAF", l)


# Prehash function must be collision resistant
def prehash(msg):
    return sha256(msg).digest()[:HASH_LEN]


class Signer:
    def __init__(self, flag):
        self.flag = flag
        self.tree = OtsTree()

    def pubkey(self):
        return self.tree.root

    def sign(self, msg):
        if json.loads(msg).get('admin'):
            raise Exception("Unauthorized admin signature")
        return {"signature": self.tree.sign(msg.encode()).hex()}

    def get_flag(self, message, signature):
        sig = bytes.fromhex(signature)
        if not self.tree.verify(message.encode(), sig):
            raise Exception("Invalid signature")
                
        response = {'success': True}
        if json.loads(message).get('admin'):
            response['flag'] = self.flag
        return response


# Binary merkle tree of height k+1 (i.e. 2^k leaves), where leaves are Winternitz public keys
class OtsTree:
    def __init__(self):
        self.seed = urandom(20)
        self.leaves = [winternitz_keygen(kdf_hash(self.seed, i)) for i in range(1 << K)]
        self.i = 0
        roots = self.leaves[:]
        while len(roots) > 1:
            roots = [mt_hash(roots[i], roots[i+1]) for i in range(0, len(roots), 2)]
        self.root = roots[0]

    def sign(self, msg):
        if self.i >= (1 << K):
            raise Exception("Out of OTSs")
        i = self.i
        self.i += 1
        ots_sig = winternitz_sign(kdf_hash(self.seed, i), msg)

        merkle_proof = b""
        nodes = self.leaves[:]
        for h in range(K):
            merkle_proof += nodes[(i >> h) ^ 1]
            nodes = [mt_hash(nodes[j], nodes[j+1]) for j in range(0, len(nodes), 2)]
        return ots_sig + i.to_bytes(4, 'big') + merkle_proof

    def verify(self, message, signature):
        return recover_root(message, signature) == self.root


def recover_root(message, signature):
    if len(signature) != OTS_SIG_LEN + 4 + K * HASH_LEN:
        return None
    ots_sig = signature[:OTS_SIG_LEN]
    i = int.from_bytes(signature[OTS_SIG_LEN:OTS_SIG_LEN+4], 'big')
    mt_path = signature[OTS_SIG_LEN+4:]
    root = winternitz_recover(message, ots_sig)
    for h in range(K):
        if (i >> h) & 1 == 0:
            root = mt_hash(root, mt_path[h*HASH_LEN:(h+1)*HASH_LEN])
        else:
            root = mt_hash(mt_path[h*HASH_LEN:(h+1)*HASH_LEN], root)
    return root


def winternitz_keygen(seed):
    priv = [kdf_hash(seed, i) for i in range(HASH_LEN)]
    pub = priv[:]
    for i in range(len(pub)):
        for j in range(256):
            pub[i] = ots_hash(pub[i], j)
    return leaf_hash(b''.join(pub))


def winternitz_sign(seed, message):
    signature = [kdf_hash(seed, i) for i in range(HASH_LEN)] 
    message = prehash(message)
    for i in range(len(signature)):
        for j in range(message[i]):
            signature[i] = ots_hash(signature[i], j)
    return b''.join(signature)


def winternitz_recover(message, signature):
    message = prehash(message)
    vk = [signature[i*HASH_LEN:(i+1)*HASH_LEN] for i in range(HASH_LEN)]
    for i in range(len(message)):
        for j in range(message[i], 256):
            vk[i] = ots_hash(vk[i], j)
    return leaf_hash(b''.join(vk))


def write(data: dict):
    print(json.dumps(data))


def read():
    try:
        return json.loads(input())
    except EOFError:
        exit(0)


WELCOME = """
Welcome to Latest Message Signing! Here's our public key.
We offer the following methods for you to use:
- 'sign': Sign a message
- 'get_flag': Fetch the flag
"""


def serve():
    signer = Signer(FLAG)

    write({'message': WELCOME, 'pubkey': signer.pubkey().hex()})
    while True:
        try:
            msg = read()

            if msg['method'] == 'sign':
                write(signer.sign(msg['message']))
            elif msg['method'] == 'get_flag':
                write(signer.get_flag(msg['message'], msg['signature']))
            else:
                raise Exception("Unknown method")
        except Exception as e:
            write({'error': str(e)})


if __name__ == "__main__": 
    serve()