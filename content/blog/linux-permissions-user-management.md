---
title: "Linux Permissions & User Management: From chmod to SUID Privilege Escalation"
date: "2025-09-05"
description: "How Linux permissions actually work — chmod numbers, ownership, groups, and how SUID bits become privilege escalation vectors during a pentest."
tags: ["linux", "permissions", "privilege-escalation", "red-team"]
---

## Why Permissions Matter to a Pentester

Permissions are not just a sysadmin topic. Every privilege escalation technique on Linux starts with understanding what you can and can't access, what runs as root, and where the misconfigurations are. This is the bridge between basic Linux and offensive security.


## Reading Permissions

When you run `ls -la`, each file shows a permission string like:

```
-rw-r--r--  1 kali kali  512 Sep  1 notes.txt
-rwxr-xr-x  1 root root  140944 Jul 5 sudo
drwx------  2 kali kali  4096 Sep  1 private/
```

Break down `-rw-r--r--`:

| Position | Meaning |
|---|---|
| `-` | File type (`-` file, `d` directory, `l` link) |
| `rw-` | Owner permissions (read + write, no execute) |
| `r--` | Group permissions (read only) |
| `r--` | Everyone else (read only) |

`r` = read, `w` = write, `x` = execute, `-` = permission not set.


## chmod — Changing Permissions

### Symbolic Method

```bash
chmod +x script.sh      # add execute for everyone
chmod u-r file.txt      # remove read from owner
chmod u+x file.txt      # add execute for owner only
```

### Numeric Method (How You'll Actually Use It)

Each permission has a number:
- `r` = 4
- `w` = 2  
- `x` = 1

Add them together for each group (owner, group, everyone):

| chmod | Owner | Group | Everyone | Meaning |
|---|---|---|---|---|
| `700` | rwx | --- | --- | Only owner has full access |
| `744` | rwx | r-- | r-- | Owner full, others read only |
| `664` | rw- | rw- | r-- | Owner and group read/write, others read |
| `777` | rwx | rwx | rwx | Everyone has full access |

Real examples from the lab:

```bash
chmod 700 file.txt      # only you can access this — nobody else
chmod 744 file.txt      # you have full access, others can read
chmod 664 file.txt      # you and your group can read/write, others read
chmod 777 file.txt      # everyone has full access (dangerous)
chmod +x script.sh      # make a script executable
```

A script named `hidad.sh` starts with `-rw-r--r--` — no execute bit. Running it does nothing. After `chmod +x hidad.sh` it becomes `-rwxr-xr-x`. Now it runs.

### Directory Permissions

```bash
chmod u-r textsfolder   # owner can enter the folder but can't see contents with ls
```

Removing read from a directory means `ls` inside it fails — the user can `cd` in but can't list what's there.


## Ownership — chown and chgrp

### Change File Owner

```bash
sudo chown bob /tmp/bobsfile        # transfer ownership to bob
sudo chown kali:kali file.txt       # set owner and group at once
```

### Change Group Ownership

```bash
sudo chgrp security persons         # give security group ownership of 'persons' file
```


## User Management

```bash
sudo useradd cabdi              # create user cabdi
sudo passwd cabdi               # set password for cabdi
su cabdi                        # switch to cabdi
exit                            # switch back

users                           # who is currently logged in
cat /etc/passwd | wc -l         # how many users exist on the system
cut -d: -f1 /etc/passwd         # list all usernames
finger cabdi                    # inspect user cabdi
whatis finger                   # quick description of a command
```


## Group Management

```bash
groups                          # which groups your user belongs to
cat /etc/group                  # all groups on the system
sudo groupadd groupname         # create a new group
sudo groupdel groupname         # delete a group
sudo gpasswd -a saacid group    # add saacid to group
sudo gpasswd -d saacid group    # remove saacid from group
```


## SUID Bit — Where Permissions Become a Pentest Vector

The SUID (Set User ID) bit is a special permission. When set on an executable, it runs with the file **owner's** privileges instead of the current user's privileges.

In a long listing, SUID shows as `s` in the owner's execute position:

```
-rwsr-xr-x 1 root root 140944 Jul 5 sudo
```

That `s` means: whoever runs `sudo`, it executes with root privileges — not their own.

### Finding SUID Files During a Pentest

```bash
find / -user root -perm -4000
```

This searches the entire filesystem for files owned by root with the SUID bit set (`-perm -4000`). Output looks like:

```
/usr/bin/chsh
/usr/bin/gpasswd
/usr/bin/pkexec
/usr/bin/sudo
/usr/bin/passwd
/usr/bin/kismet_capture
```

### Why This Matters

If any of these binaries has a known vulnerability or can be abused — for example through argument injection, path manipulation, or a known CVE — you can use it to execute code as root even from a low-privilege user account.

This is one of the first checks in any Linux privilege escalation workflow. After you get a shell as a low-privilege user:

```bash
find / -user root -perm -4000 2>/dev/null
```

The `2>/dev/null` suppresses permission denied errors so the output is clean.

### SUID in Practice

Navigate to `/usr/bin` and check `sudo`:

```bash
cd /usr/bin
ls -l sudo
```

Output:

```
-rwsr-xr-x 1 root root 140944 Jul 5 2018 sudo
```

The `s` confirms SUID is set. Anyone running this binary gets root-level execution for that process. If an attacker gains control of an application that has SUID set and accesses `/etc/shadow` (the password file), they have access to hashed passwords for every user on the system.


## Disk Space by Directory

```bash
df -h           # overall disk usage
du -sh folder/  # disk space used by a specific folder
```


## What's Next

Next post covers Linux networking commands — how to inspect interfaces, check open ports, configure the firewall, and use the tools you'll reach for during every network-based engagement.