# justCTF 2024 Finals

This repo contains sources for [justCTF 2024 finals](https://2024.justctf.team/) challenges hosted by [justCatTheFish](https://ctftime.org/team/33893) as well as summary of winners and sponsors of the event. The event was hosted on-site alongside the [HackYeah](https://hackyeah.pl/) hackathon in Kraków, Poland on the 28th and 29th of September 2024. In total, the CTF hosted 120+ people with 301 flags submitted.

TLDR: Run a challenge with `./run.sh` (requires Docker/docker-compose and might require `sudo` as we use `nsjail` extensively under the hood).

The [`challenges/`](./challenges/) contains challanges directories with the following structure:
* `README.md` - official challenge description used during CTF
* `public/` - files that were public/to download
* `private/` - sources and other unlisted files
* `private/run.sh` - shell script to run the challenge locally (uses Docker and sometimes docker-compose)
* `private/flag.txt` - the flag (don't look there?)
* `private/metadata.json` - challenge metadata
* `private/solve.sh`/`private/solver/` - scripts and files with raw solution (not present for every challenge)
* other files


### Winners & Prizes
Main bracket:
* 1st place - [FluxFingers](https://ctftime.org/team/551) - 15000 PLN + IDA Pro + Burp Suite Pro
* 2nd place - [ECSC Team France](https://ctftime.org/team/159269) - 10000 PLN + Burp Suite Pro
* 3rd place - [thehackerscrew](https://ctftime.org/team/85618) - 5000 PLN + Burp Suite Pro

Polish academic bracket:
* 1st place - [KNPING](https://ctftime.org/team/284152) - 2000 PLN + IDA Pro + Burp Suite Pro
* 2nd place - [Wojownicy z Piwnicy](https://ctftime.org/team/155060) - 1000 PLN
* 3rd place - [zazolcgeslajazn](https://ctftime.org/team/185960) - 5000 PLN

### justCTF 2024 Finals sponsors:
* Trail of Bits - https://www.trailofbits.com/
* OtterSec - https://osec.io/
* Orange Polska - https://www.orange.pl/
* Techland - https://techland.net/
* HEX-RAYS - https://hex-rays.com/
* PortSwigger - https://portswigger.net/
* SECFORCE - https://www.secforce.com/
* Intigriti - https://www.intigriti.com/
* Artixen - https://artixen.net/

Thanks again to all the sponsors who made this event possible!

### Challenges

(Sorted from most solved to least solved)

| Category         | Name                   | Points | Solves |
|------------------|------------------------|--------|--------|
| Baby, Web        | Quiz                   | 50     | 27     |
| Baby, Misc       | wow_signal             | 50     | 26     |
| Misc, Baby       | Sanity check           | 50     | 26     |
| Baby, Misc       | QRazy                  | 50     | 25     |
| Baby, Web        | Coms                   | 50     | 23     |
| Baby, Misc       | NFC Gold               | 50     | 23     |
| Misc             | Relocate               | 50     | 20     |
| Baby, Re         | AntiRunMe              | 58     | 17     |
| Misc             | NFC Flag Market        | 58     | 17     |
| Pwn, Baby        | Calculator             | 72     | 16     |
| Re, Baby         | Baby License           | 137    | 12     |
| Baby, Crypto     | OTP encryption         | 156    | 11     |
| Re               | Quirk3                 | 248    | 7      |
| Baby, Blockchain | RoboOtter Lab          | 248    | 7      |
| Crypto           | Latest Message Signing | 248    | 7      |
| Pwn              | securiotee             | 277    | 6      |
| Baby, Web        | flag-service           | 277    | 6      |
| Web              | Calc                   | 388    | 3      |
| Web              | myczek                 | 388    | 3      |
| Fore, Misc       | justUnknown device     | 388    | 3      |
| Misc             | JustNFTables           | 388    | 3      |
| Misc             | pwndbg-me              | 388    | 3      |
| Games            | Pawel jumper           | 438    | 2      |
| Misc, Re         | Eraser                 | 438    | 2      |
| Re               | Captcha                | 500    | 1      |
| Web              | Madness                | 500    | 1      |
| Pwn              | Baby heap but windows  | 500    | 1      |
| Crypto, Web      | Trusted Blinding       | 500    | 1      |
| Games            | Minecraft: Pumpkin     | 500    | 1      |
| Pwn              | catnas                 | 500    | 1      |
| Re               | Compiler Safari        | 500    | 0      |
| Games            | Minecraft: Cheat death | 500    | 0      |
| Misc             | anomaly                | 500    | 0      |
| Blockchain       | Otter Bay Council      | 500    | 0      |


### Write-ups
Write-ups created by players can be found on [CTFTime](https://ctftime.org/event/2484/tasks/) as well as on [our discord](https://discord.gg/phyqdh6). 
You should also look at challenges solution directories, if they exist (`solver.sh`/`solver/`).
