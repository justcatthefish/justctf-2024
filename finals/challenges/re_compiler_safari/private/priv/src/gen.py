import sys

def rand():
  seed = 0
  while True:
    seed = (1103515245 * seed + 12345) & (2**64-1)
    yield seed

r = rand()
for i in range(100):
  sys.stdout.write(str(next(r)) + " ")
print();print("x")

sys.stdout.write(str(0)+ " ")
for i in range(99):
  sys.stdout.write(str(2**63-1) + " ")
print();print("x")
