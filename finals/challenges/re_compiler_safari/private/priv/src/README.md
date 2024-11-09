## justCTF - Tiger RE challenge

**Name:** Compiler Safari

**Description:**
A comp-sci student built their own compiler from scratch and programmed a math
game on its language. The result is a quirky binary hiding its secrets in
layers of odd code. Your task: reverse-engineer the game binary, learn how to
play the game, and win a round with the server to acquire the flag.

**Solver:** see `gen.py`

### Game explanation

1. The game reads two arrays of integers: `X = [x1, x2, x3, ...]` and `Y = [y1, y2, y3, ...]`
2. `len(X)` and `len(Y)` should be `>= 25` or it will complain `Too short!`
3. `y1` is used to seed a PRNG following the sequence `S_{n+1} = 1103515245 * S_n + 12345` on a 64-bit unsigned int.
4. The merge (as in merge sort's merge operation) of (not necessarily sorted!) `X` and `Y` is computed: `M = merge(X, Y)`
5. The first 100 numbers from `S_n` must match the `M`
