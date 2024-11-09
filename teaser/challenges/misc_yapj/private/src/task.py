#!/bin/env python3

import os
import sys

print('Gimme code')
inp = input()
allowed = set('(:=),._abcdeiklmnopqstry ')
banned = sorted(set(inp) - allowed)
print(banned)
if banned:
    os._exit(1)

cod = compile(inp, '<yololo>', 'eval')
def f(_exit=os._exit):
    enab = 0
    def hooke(*a):
        nonlocal enab
        if enab == 1:
            _exit(1)
        enab += 1
    sys.addaudithook(hooke)
    fla = eval(cod, {"__builtins__": {}})
    a = {}
    enab = 2
    a |= []
    _exit(1)
f()
