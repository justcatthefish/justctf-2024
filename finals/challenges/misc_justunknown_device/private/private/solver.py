from Crypto.Cipher import AES
from binascii import unhexlify

aes_key = b'\xf0\x2f\x20\x10\x59\x6A\x79\x82\x91\xA0\xB2\xC0\xD2\xE0\xF0\x02'
iv = bytes([0] * 16)
encrypted_message_hex = "F26DD9CCF671FA82641A459C5CA6E34AEFB0C8C42BDC08FD64027C7AEDF36C07C462F5C5B199DEB43A84861F43AE402F"
encrypted_message = unhexlify(encrypted_message_hex)

cipher = AES.new(aes_key, AES.MODE_CBC, iv)
decrypted_message = cipher.decrypt(encrypted_message)
decrypted_message = decrypted_message.rstrip(b'\x00')

decrypted_text = decrypted_message.decode()
print(decrypted_text)