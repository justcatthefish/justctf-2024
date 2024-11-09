# justCTF 2024 Teaser

This repo contains sources for [justCTF 2024 teaser](https://2024teaser.justctf.team/) challenges hosted by [justCatTheFish](https://ctftime.org/team/33893) as well as summary of winners and sponsors of the event.

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
* 1st place - [P1G SEKAI](https://ctftime.org/team/169557)
* 2nd place - [FluxFingers](https://ctftime.org/team/551)
* 3rd place - [Team Austria](https://ctftime.org/team/193899)
* 4th place - [ECSC Team France](https://ctftime.org/team/159269)
* 5th place - [SKSD](https://ctftime.org/team/211952)
* 6th place - [thehackerscrew](https://ctftime.org/team/85618)

Top 3 teams: 1x IDA Pro named license for a year with 2 decompilers
Top 6 teams: 1x Burp Suite Professional license for a year + reimbursement of travel expenses for 4 people to the finals

### justCTF 2024 Teaser sponsors:
* Trail of Bits - https://www.trailofbits.com/
* OtterSec - https://osec.io/
* HEX-RAYS - https://hex-rays.com/
* PortSwigger - https://portswigger.net/
* Intigriti - https://www.intigriti.com/
* SECFORCE - https://www.secforce.com/

Thanks again to all the sponsors who made this event possible!

### Challenges

(Sorted from most solved to least solved)

| Category    | Name                               | Points | Solves |
|-------------|------------------------------------|--------|--------|
| Misc        | Sanity check                       | 50     | 419    |
| Misc, Pwn   | HaSSHing                           | 174    | 64     |
| Crypto      | Reverse Cryptographing             | 178    | 62     |
| Web         | Piggy                              | 180    | 61     |
| Re, Misc    | Star                               | 201    | 50     |
| Web         | justPocketTheBase                  | 215    | 44     |
| Crypto      | Duality                            | 237    | 36     |
| Blockchain  | The Otter Scrolls                  | 246    | 33     |
| Fore, Misc  | Baby SoC                           | 256    | 30     |
| Blockchain  | World of Ottercraft                | 271    | 26     |
| Blockchain  | Dark BrOTTERhood                   | 275    | 25     |
| Web         | Bypass Backlash: Route Exploration | 283    | 23     |
| Re, Misc    | just TV                            | 326    | 15     |
| Ppc         | Wild West                          | 355    | 11     |
| Crypto, Pwn | interlock                          | 355    | 11     |
| Fore, Misc  | Budget SoC                         | 363    | 10     |
| Misc, Web   | Casino                             | 394    | 7      |
| Misc        | leaving soon                       | 406    | 6      |
| Misc, Pwn   | yapj                               | 435    | 4      |
| Pwn         | q3vm                               | 435    | 4      |
| Web         | Another Another CSP                | 500    | 1      |
| Web         | Letters                            | 500    | 0      |
| Pwn         | Blu Ray of Death                   | 500    | 0      |
| Re          | Cursed Protocol                    | 500    | 0      |


### Write-ups
Write-ups created by players can be found on [CTFTime](https://ctftime.org/event/2342/tasks/) as well as on [our discord](https://discord.gg/phyqdh6). 
You should also look at challenges solution directories, if they exist (`solver.sh`/`solver/`).
