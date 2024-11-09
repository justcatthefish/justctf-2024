import random

ALPHABET = "1234567890qwertyuiopasdfghjkl{zxcvbnm_!@#$%^&*+=QWERTYUIOPASDFGHJKL}ZXCVBNM-"
BIT_WIDTH = 7

FLAG = "justCTF{0ld_TV_c4n_b3_InTeR4ctIv3}"

print("Available letters count:", len(ALPHABET))

def generate_xor_mapping(alphabet, size):
    mapping = dict()
    mapping_stream = ""
    for index, symbol in enumerate(alphabet):
        bit_repr = bin(index)[2:].zfill(size)
        mapping_stream += bit_repr
        mapping[symbol] = bit_repr

    return mapping, mapping_stream

def xor(lhs, rhs):
    if lhs == rhs:
        return "0"
    else:
        return "1"

alphabet_mapping, alphabet_mapping_stream = generate_xor_mapping(ALPHABET, BIT_WIDTH)

print(alphabet_mapping)

print("ALPHABET = ", ALPHABET)
print("MAPPING = ", alphabet_mapping_stream)

# keystream = "".join([str(random.randrange(2)) for _ in range(len(FLAG) * 7 * 2)])
keystream = "00011001101110001010100100010001100100011001000011010001110101001111011011000100100111100100001011000010111001110101101110101100100101111010001100011110010111000010010100111100111101111011110100111010010110011010111110110111010111100100011110011100000010010100110100000110101011110101001010000010101000101001001010010111101110111110011001010100010000000110100001110100101111110100110011011100100000011011010101011110010010111111011101001111000100001101101001011000000001111110"
print("RANDOM KEYSTREAM = ", keystream)

print(len(keystream))
print(len(keystream[len(FLAG)*7:]))
print(len(keystream[0:len(FLAG) * 7]))

shifted_keystream = keystream[len(FLAG)*7:] + keystream[0:len(FLAG) * 7]
print("SHIFTED_KEYSTREAM = ", shifted_keystream)

flag_stream = "".join([alphabet_mapping[sym] for sym in FLAG])

target_stream = "".join([xor(sym1, sym2) for sym1, sym2 in zip(flag_stream, shifted_keystream)])

target_stream += shifted_keystream[len(target_stream):]

print("TARGET_STREAM = ", target_stream)

encoded_flag = "".join([alphabet_mapping[letter] for letter in FLAG])
print("ENCODED_FLAG = ", encoded_flag)
