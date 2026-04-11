---
title: "GPG Encryption Across Networks: Secure File Transfer the Right Way"
date: "2025-11-10"
description: "How I set up GPG key exchange and encrypted file transfer between two machines on different networks — including a real SCP error I hit on Kali and exactly how I fixed it."
tags: ["cryptography", "gpg", "linux", "security", "lab"]
---

## What This Is About

If you want to send a file to someone and guarantee that nobody else can read it — not your ISP, not someone intercepting the traffic, nobody — GPG is how you do it. It works over any network, any distance. Somalia to Europe, same result.

This is a walkthrough of a lab I ran with two Kali machines simulating a sender and receiver on different networks. I'll cover the full GPG flow, and also a real SSH error I hit during the SCP transfer that took me a minute to diagnose and fix.


## Lab Setup

- **Machine 1 (Receiver):** Kali Linux — `172.20.10.5`
- **Machine 2 (Sender):** Kali Linux — separate network
- **Goal:** Receiver generates a key pair, sends the public key to the sender, sender encrypts a file with it and sends it back, receiver decrypts it

The two machines are not on the same LAN. File transfer goes over SCP.


## How GPG Works (The Short Version)

GPG uses asymmetric encryption — two mathematically linked keys:

- **Public key** — share this with everyone. Anyone can use it to encrypt a message to you.
- **Private key** — never share this. Only you can decrypt messages encrypted with your public key.

The important thing: encrypting with someone's public key means only their private key can decrypt it. Even if the encrypted file is intercepted in transit, it's useless without the private key.


## Step 1 — Receiver Generates a Key Pair

On the receiver machine (`172.20.10.5`):

```bash
gpg --full-generate-key
```

GPG walks you through it — key type, key size, expiry, name, email. Use RSA 4096 for strong encryption. Set an expiry if this is for a real engagement. Choose a strong passphrase — this protects your private key if the machine is ever compromised.

Once done, verify the key exists:

```bash
gpg --list-keys
```


## Step 2 — Export the Public Key

The receiver exports their public key to a file:

```bash
gpg --armor --export friend@example.com > publickey.asc
```

`--armor` outputs it as ASCII text instead of binary. This makes it safe to email, paste into a chat, or upload anywhere. Public keys are meant to be shared openly — you can post them on GitHub, your website, anywhere.


## Step 3 — Transfer the Public Key to the Sender

This is where I hit a real problem.

I tried to SCP the public key from the receiver machine to the sender:

```bash
scp publickey.asc kali@172.20.10.5:~
```

And got this error:

```
Unsupported KEX algorithm "mlkem768x25519-sha256"
Bad SSH2 KexAlgorithms
scp: Connection closed
```

### What's Actually Happening

Newer Kali releases added post-quantum key exchange algorithms to the SSH config — specifically in `/etc/ssh/ssh_config.d/kali-wide-compat.conf`. The sending Kali was trying to negotiate using `mlkem768x25519-sha256`, a post-quantum algorithm, but the receiving Kali didn't support it. Both machines need to support the same algorithms for the handshake to work.

### Fix 1 — Quick Override (Temporary)

Tell SCP to skip the incompatible algorithms and use a fallback:

```bash
scp -o KexAlgorithms=+diffie-hellman-group14-sha1 publickey.asc kali@172.20.10.5:~
```

This works but you'll need to add the flag every time.

### Fix 2 — Disable the Broken Config (Permanent)

Rename the faulty config file so SSH stops loading it:

```bash
sudo mv /etc/ssh/ssh_config.d/kali-wide-compat.conf /etc/ssh/ssh_config.d/kali-wide-compat.conf.bak
```

Retry the SCP without any extra flags:

```bash
scp publickey.asc kali@172.20.10.5:~
```

Works. The file transfers cleanly.

I went with Fix 2. Renaming keeps the original file intact if you ever need it back, but stops SSH from loading the broken algorithms on every connection.


## Step 4 — Sender Imports the Public Key

On the sender machine, import the received public key:

```bash
gpg --import publickey.asc
```

Verify it imported correctly:

```bash
gpg --list-keys
```

You should see the receiver's key in the keyring. Your machine now knows how to encrypt something only they can read.


## Step 5 — Sender Encrypts a File

Create a test file:

```bash
echo "The password is: fufu12345" > secret.txt
```

Encrypt it using the receiver's public key:

```bash
gpg --encrypt --armor -r friend@example.com secret.txt
```

This produces `secret.txt.asc`. Open it — it looks like this:

```
-----BEGIN PGP MESSAGE-----

hQIMA7X3k9vGqzl...
(unreadable ciphertext)
-----END PGP MESSAGE-----
```

That file is useless to anyone without the receiver's private key. You can email it, upload it, post it publicly — it doesn't matter. Nobody can read it.


## Step 6 — Send the Encrypted File Back

SCP the encrypted file to the receiver:

```bash
scp secret.txt.asc kali@172.20.10.5:~
```

No errors this time — the config fix from Step 3 is still in place.


## Step 7 — Receiver Decrypts It

On the receiver machine:

```bash
gpg -d secret.txt.asc
```

GPG prompts for the passphrase set during key generation. Enter it and the plaintext appears:

```
The password is: fufu12345
gpg: Signature made...
gpg: Good signature from "friend@example.com"
```


## Optional: Sign Your Message Too

Encryption proves only the private key holder can read the message. Signing proves the message came from you specifically.

Encrypt and sign in one command:

```bash
gpg --armor --encrypt --sign -r friend@example.com secret.txt
```

The receiver verifies the signature:

```bash
gpg --verify secret.txt.asc
```

If the signature is valid, they know it came from your key and wasn't tampered with in transit.


## Why This Matters Beyond the Lab

This is the same mechanism journalists use to receive documents from whistleblowers without exposing the source. The receiver publishes their public key, the sender encrypts with it, and the file can travel through any network — monitored, logged, intercepted — without revealing its contents.

For red team work: GPG is how you'd securely exfiltrate sensitive findings during an engagement without exposing them in transit. For blue team: understanding this tells you exactly why encrypted exfiltration is hard to detect at the network layer — the content is opaque, you can only see that an encrypted transfer happened.


## Quick Reference

| Task | Command |
|---|---|
| Generate key pair | `gpg --full-generate-key` |
| Export public key | `gpg --armor --export email > key.asc` |
| Import public key | `gpg --import key.asc` |
| Encrypt a file | `gpg --encrypt --armor -r email file` |
| Encrypt and sign | `gpg --armor --encrypt --sign -r email file` |
| Decrypt a file | `gpg -d file.asc` |
| Fix Kali SCP KEX error | `sudo mv /etc/ssh/ssh_config.d/kali-wide-compat.conf{,.bak}` |
| Transfer file via SCP | `scp file user@ip:~` |