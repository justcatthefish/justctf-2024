#!/usr/bin/env python3
import hashlib
import random
import string

import numpy as np

from math import log, comb, ceil

USE_USER_INPUT = True
N_CASINOS = 3
def get_bet(win, loss, p, balance):
    print(f"Win: {win}, loss: {loss}, p(win): {p}, balane: {balance}")

    if USE_USER_INPUT:
        return input("You suggest to bet:")
    else:
        # TODO: DONT SHARE, ITS A SOLUTION
        return int(balance * max(0, min(1, (p / loss - (1 - p) / win))))
def coin_flip(p):
    assert 0 <= p <= 1
    return random.random() < p

def play_game(win, loss, p, N):
    assert win >= loss, "That casino should be good for players, server error"
    initial_balance = balance = random.randint(100000, 10000000)
    print("Here is the next citizen who needs your help with {balance} coins.")

    for game_id in range(N):
        print("Game", 1+game_id, "out of", N)
        bet = int(get_bet(win, loss, p, balance))
        assert 0 <= bet <= balance, "Wrong value of bet"
        assert bet is not None, "Wrong value of bet"
        if coin_flip(p):
            print("Success!")
            balance += bet * win
        else:
            print("Fail!")
            balance -= bet * loss

        balance = int(round(balance))
        print(f"The player has {balance}.")

    if balance > initial_balance:
        print("Winner!")
    else:
        print("Ups!")

    return balance, initial_balance

def binomial_prob_at_least(N, X, p):
    probability = 0
    for k in range(X, N + 1):
        probability += comb(N, k) * (p ** k) * ((1 - p) ** (N - k))
    return probability

def binomial_probability(N, X, p):
    return comb(N, X) * (p ** X) * ((1 - p) ** (N - X))

def calculate_expected_winners(a, b, p, N):
    min_to_fail = log(b) / (log(b) - log(a))

    return binomial_prob_at_least(N, ceil(N*min_to_fail), 1-p)
def calculate_average_wealth(a, b, p, N):
    wealth = 0.
    for X in range(N):
        wealth += binomial_probability(N, X, p) * a**X * b**(N-X)

    return wealth

def visit_casino(win, loss, p, N, players_N):
    print("NEW CASINO!")
    print(f"Those {players_N} people don't want to lose even one coin.")
    print(f"Win {win*100}% with chance {p*100}% or lose {loss*100}% in every game.")
    wealth = 0
    winners = 0
    results = []
    for _ in range(players_N):
        balance, initial_balance = play_game(win, loss, p, N)
        wealth += balance / initial_balance
        if balance >= initial_balance:
            winners += 1
        results.append(balance / initial_balance)


    required_grade = 0.95

    median_score = np.median(results)
    print("Median score:", median_score)
    best_bet = p / loss - (1 - p) / win
    game_expected = pow(1 + win * best_bet, p) * pow(1 - loss * best_bet, (1-p))
    expected_median = pow(game_expected, N)

    required_median = required_grade * expected_median
    # print("required_median ", required_median)
    assert median_score >= required_median, "Too bad median score."

    winners_score = winners/players_N
    print("Winners score:", winners_score)

    expected_winners = calculate_expected_winners(1 + win * best_bet, 1 - loss * best_bet, p, N)
    required_winners = expected_winners * required_grade
    # print("required_winners:", required_winners)
    assert winners_score >= required_winners, "Too bad winners score."

    wealth_score = wealth/players_N
    print("Wealth score: ", wealth_score)
    print("You helped them!\n\n")

    expected_wealth = calculate_average_wealth(1 + win * best_bet, 1 - loss * best_bet, p, N)
    required_wealth = (expected_wealth) * 0.65
    # print("Required wealth: ", required_wealth)
    if wealth_score >= required_wealth:
        print("And the town is wealthy!")
        return 1
    print("But the town is not wealthy enough...")
    return 0

def generate_random_string(length):
    """Generate a random string of given length."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def solve_hashcash(prefix, zero_length):
    hash_value = sufix = ""
    while hash_value[:zero_length] != "0" * zero_length:
        sufix = generate_random_string(16)
        combined = prefix + sufix
        # Calculate the SHA-256 hash of the combined string
        hash_value = hashlib.sha256(combined.encode()).hexdigest()
    print("Found: ", sufix)
    return sufix
def hashcash_challenge(zero_length):
    """Generate a Hashcash challenge and ask the user to solve it."""
    # Generate a random string
    prefix = generate_random_string(16)
    print("prefix:", prefix)
    print("zero_length: ", zero_length)
    print("""
    combined = prefix + user_inpt
    # Calculate the SHA-256 hash of the combined string
    hash_value = hashlib.sha256(combined.encode()).hexdigest()
    # Check if the hash starts with the specified prefix

    if hash_value[:zero_length] == "0" * zero_length:
        # Challenge solved by the user
        print(f"Congratulations! You solved the Hashcash challenge.")
    """)
    #solve_hashcash(prefix, zero_length)
    user_inpt = input("sufix: ")
    combined = prefix + user_inpt
    # Calculate the SHA-256 hash of the combined string
    hash_value = hashlib.sha256(combined.encode()).hexdigest()
    # Check if the hash starts with the specified prefix

    if hash_value[:zero_length] == "0" * zero_length:
        # Challenge solved by the user
        print(f"Congratulations! You solved the Hashcash challenge.")
        print("Now the real fun starts!")
        return None
    print("Nope!")
    exit(1)



# Example usage
if __name__ == "__main__":
    if USE_USER_INPUT:
        hashcash_challenge(5)

    ps = [0.5] * (N_CASINOS - 2) + [random.random()/4+0.4 for _ in range(2)]
    assert len(ps) == N_CASINOS
    ws = [0.8] * 2 + [random.random()/2+0.5 for _ in range(N_CASINOS - 2)]
    assert len(ws) == N_CASINOS
    ls = [0.5] * 1 + [min(ws[1+i]*0.8, random.random()/3+0.35) for i in range(N_CASINOS - 1)]
    assert len(ls) == N_CASINOS
    Ns = [30, 10, 50]
    assert len(Ns) == N_CASINOS
    PNs = [300, 150, 75]
    assert len(PNs) == N_CASINOS

    wins = 0
    for i in range(N_CASINOS):
        p = ps[i]
        loss = ls[i]
        win = ws[i]

        if (p / loss - (1 - p) / win) <= 0:
            p = 0.5

        wins += visit_casino(ws[i], ls[i], p, Ns[i], PNs[i])

    print("Wealthy towns:", wins)

    if wins == N_CASINOS:
        print("justCTF{that_would_never_happen_IRL}")
    else:
        print("Not enough of wealthy towns...")
