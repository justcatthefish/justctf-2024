# Trusted Blinding

Welcome to the enchanted domain of Trusted Blinding!

Unleash an amorous tale or a celestial song from the hidden depths of your heart, letting it flutter eloquently into the world. With us, your identity remains shrouded in a veil of delicate mystery until the moment that you choose to lift it.

When the time is ripe to declare your lyrical genius, step forward and claim your rightful authorship.

Bathing in the sanctity of our platform, we employ a unique cryptographic waltz, a seamless blend of magic and technology, ensuring a bond of trust, confirming your sole rights to authorship while refuting any claims of untruth.

Come, join Trusted Blinding, where your poetic whispers will meet the world, and perhaps, spark a silent revolution of words.


## How to use

First, register in GitHub. Then add **signing** SSH public key in [the settings](https://github.com/settings/keys).
The key must be RSA key (`ssh-rsa ` prefix) of at most 4096 bits.

Use cli.py to interact with the service:
1. register
2. login
3. configure GitHub user with `config_oidc` method
4. write and upload your poem
5. initialize blind signing
6. finalize blind signing

---
Some code is based on [bezkoder](https://github.com/bezkoder/node-js-jwt-authentication-postgresql) (not important for the CTF, just FYI).