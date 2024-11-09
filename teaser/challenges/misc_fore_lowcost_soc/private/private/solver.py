"""
From reverse engineering the app0 partition converted to elf (steps like in the baby_soc)

void FUN_400d29b8(void)

{
  int iVar1;
  undefined4 uVar2;
  undefined auStack_94 [16];
  undefined auStack_84 [16];
  undefined auStack_74 [16];
  undefined auStack_64 [32];
  undefined auStack_44 [32];
  int iStack_24;
  
  memw();
  memw();
  iStack_24 = _DAT_3ffc4120;
  println(0x3ffc3eec,&DAT_3f400120);
  FUN_400d8c30(auStack_94,s__<!DOCTYPE_html>_<html>_<head>_<_3f400125);
  if (DAT_3ffc3ca8 != '\0') {
    println(0x3ffc3eec,s_here2_3f4002d0);
    if (0x83 < _DAT_3ffc3e3c) {
      FUN_400894f0(auStack_64,_DAT_3ffc3e38 + 100,0x20);
    }
    FUN_400d296c(auStack_64,auStack_44,0x20);
    FUN_400d8c30(auStack_84,auStack_44);
    FUN_400d8c30(auStack_74,s_<h2>Flag:_3f4002d6);
    uVar2 = FUN_400d8fa8(auStack_74,auStack_84);
    uVar2 = FUN_400d8fd8(uVar2,s_</h2>_3f4002e1);
    FUN_400d8ec4(auStack_94,uVar2);
    FUN_400d8a98(auStack_74);
    FUN_400d88ac(0x3ffc3eec,auStack_84);
    FUN_400d8a98(auStack_84);
  }




void FUN_400d296c(undefined4 param_1,undefined4 param_2,undefined2 param_3)

{
  undefined4 uVar1;
  undefined auStack_144 [16];
  undefined auStack_134 [272];
  int iStack_24;
  
  memw();
  memw();
  iStack_24 = _DAT_3ffc4120;
  FUN_400d7dac(auStack_134);
  uVar1 = FUN_40089650(auStack_144,0,0x10);
  FUN_400d831c(auStack_134,param_1,param_3,param_2,&DAT_3ffbdb68,0x10,uVar1);
  memw();
  memw();
  if (iStack_24 != _DAT_3ffc4120) {
    func_0x40082af0();
  }
  return;
}



                             DAT_3ffbdb68                                    XREF[1]:     400d002c(*)  
        3ffbdb68 33              ??         33h    3
        3ffbdb69 bd              ??         BDh
        3ffbdb6a fb              ??         FBh
        3ffbdb6b 72              ??         72h    r
        3ffbdb6c 4c              ??         4Ch    L
        3ffbdb6d 22              ??         22h    "
        3ffbdb6e 87              ??         87h
        3ffbdb6f 33              ??         33h    3
        3ffbdb70 62              ??         62h    b
        3ffbdb71 ff              ??         FFh
        3ffbdb72 75              ??         75h    u
        3ffbdb73 41              ??         41h    A
        3ffbdb74 d5              ??         D5h
        3ffbdb75 14              ??         14h
        3ffbdb76 f6              ??         F6h
        3ffbdb77 fd              ??         FDh


{ 0x33, 0xbd, 0xfb, 0x72, 0x4c, 0x22, 0x87, 0x33, 0x62, 0xff, 0x75, 0x41, 0xd5, 0x14, 0xf6, 0xfd }


based on FUN_400d831c - can reverse the function or do an educated guess that this is a block cipher - AES-CBC

Based on parameters 0x20 in FUN_400d296c decrypt function - there are two blocks (32 bytes in total). 32 bytes comes from EEPROM (offset = 100)

```
  Bitmap State : Erased
    Written Entry 54
      NS Index : 1
          NS : eeprom
      Type : BLOB_DATA
      Span : 17
      ChunkIndex : 0
      Key : eeprom
      Blob Data :
        Size : 512
        Data :
00000000: 74 68 69 73 69 73 6E 6F  74 61 66 6C 61 67 00 AC  thisisnotaflag..  <=== result start
00000010: 59 7B 85 69 D4 36 AC BF  AB D5 B2 12 3C F4 C7 E3  Y{.i.6......<...
00000020: D6 29 86 35 DC F2 C1 42  6E 21 38 1C 17 B3 FD 4F  .).5...Bn!8....O
00000030: 74 B4 5C FF A5 13 0A E3  33 9D F3 D5 23 40 18 1F  t.\.....3...#@..
00000040: 7D 48 3C 41 8A 18 76 E3  B9 6F 13 9C A5 F9 86 A7  }H<A..v..o......
00000050: 6C FF C1 08 60 9E 8B 12  E8 10 CC 67 CA 02 70 22  l...`......g..p"
00000060: 64 59 03 FF 8F BB 3B 52  DF 2B AA D5 44 75 49 BF  dY....;R.+..DuI.
00000070: 29 E7 0F 58 0A A6 15 8A  34 82 99 AD AC EC 0C D3  )..X....4.......
00000080: 26 75 59 F2 FF FF FF FF  FF FF FF FF FF FF FF FF  &uY.............
```

In [22]: print([i for i in result][100:100+32])
['8F', 'BB', '3B', '52', 'DF', '2B', 'AA', 'D5', '44', '75', '49', 'BF', '29', 'E7', '0F', '58', '0A', 'A6', '15', '8A', '34', '82', '99', 'AD', 'AC', 'EC', '0C', 'D3', '26', '75', '59', 'F2']

Now these values should be decrypted using key obtained from DAT_3ffbdb68 (which happens to be 16 bytes long :))

```
from Crypto.Cipher import AES
    ...: from Crypto.Util.Padding import unpad
    ...: import binascii
    ...:
    ...: encrypted_values = ['8F', 'BB', '3B', '52', 'DF', '2B', 'AA', 'D5', '44', '75', '49', 'BF', '29', 'E7', '0F', '
    ...: 58', '0A', 'A6', '15', '8A', '34', '82', '99', 'AD', 'AC', 'EC', '0C', 'D3', '26', '75', '59', 'F2']
    ...: key = bytes([0x33, 0xbd, 0xfb, 0x72, 0x4c, 0x22, 0x87, 0x33, 0x62, 0xff, 0x75, 0x41, 0xd5, 0x14, 0xf6, 0xfd])
    ...: iv = bytes([0x00] * 16)
    ...:
    ...: encrypted_bytes = bytes([int(x, 16) for x in encrypted_values])
    ...:
    ...: cipher = AES.new(key, AES.MODE_CBC, iv)
    ...: decrypted_bytes = unpad(cipher.decrypt(encrypted_bytes), AES.block_size)
    ...: decrypted_text = decrypted_bytes.decode('utf-8')
    ...:
    ...: print("Flag:", decrypted_text)
Flag: jctf{dUmp3d_r3v3rs3d_h4ck3d}
```
"""

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import binascii

encrypted_values = ['8F', 'BB', '3B', '52', 'DF', '2B', 'AA', 'D5', '44', '75', '49', 'BF', '29', 'E7', '0F', '58', '0A', 'A6', '15', '8A', '34', '82', '99', 'AD', 'AC', 'EC', '0C', 'D3', '26', '75', '59', 'F2']
key = bytes([0x33, 0xbd, 0xfb, 0x72, 0x4c, 0x22, 0x87, 0x33, 0x62, 0xff, 0x75, 0x41, 0xd5, 0x14, 0xf6, 0xfd])
iv = bytes([0x00] * 16)

encrypted_bytes = bytes([int(x, 16) for x in encrypted_values])

cipher = AES.new(key, AES.MODE_CBC, iv)
decrypted_bytes = unpad(cipher.decrypt(encrypted_bytes), AES.block_size)
decrypted_text = decrypted_bytes.decode('utf-8')

print("Decrypted text:", decrypted_text)
