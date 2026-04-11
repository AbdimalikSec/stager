---
title: "Red Team Linux Tricks: Covering Tracks, DD, Processes, and Anonymity"
date: "2025-09-15"
description: "The Linux techniques that matter on a real engagement — covering your tracks, cloning drives with dd, killing processes cleanly, and routing traffic through Tor."
tags: ["linux", "red-team", "covering-tracks", "privilege-escalation", "anonymity"]
---

## Beyond the Basics

This is the fourth post in the Linux series. By now you know the filesystem, permissions, and networking. This one covers the techniques that are specific to offensive security work — things you'd use during or after an engagement that you won't find in a standard Linux tutorial.


## Covering Tracks — Command History

By default Linux stores everything you type. That's a problem during an engagement where you don't want to leave evidence of what you ran.

### Understand How History Works

```bash
history             # see everything you've typed
echo $HISTSIZE      # how many commands are stored (default: 1000)
```

### Disable History for the Current Session

```bash
HISTSIZE=0
```

This stops the current session from storing commands. But close the terminal and reopen it — HISTSIZE resets to 1000.

### Make It Permanent

First, save your current variable values so you can restore them:

```bash
set > ~/valueofALL.txt
echo $HISTSIZE > ~/valueofHISTSIZE.txt
```

Then disable permanently:

```bash
HISTSIZE=0
export HISTSIZE
```

Now close and reopen the terminal. Commands typed before `HISTSIZE=0` are still there — but nothing after will be stored.

### Nuclear Option — Delete History Entirely

```bash
rm ~/.zsh_history        # if using zsh
rm ~/.bash_history       # if using bash
```

Or clear the file without deleting it:

```bash
cat /dev/null > ~/.bash_history
```


## Changing Your Terminal Prompt

Small thing but useful for maintaining a mental model of what machine you're on:

```bash
export PS1='C:\w> '     # make your terminal look like Windows cmd
export PS1='attacker# '  # label it clearly during an engagement
```

This only lasts the session. Add it to `~/.bashrc` to make it permanent.


## Killing Processes

### By PID

```bash
ps -aux | grep suspicious.sh    # find the process and get its PID
kill -9 6996                    # absolute kill signal — no mercy
```

`kill -9` is the hard kill. The process gets no chance to clean up. Use it on zombie processes or anything that won't respond to a normal `kill`.

### By Name

```bash
killall -9 zombieprocess        # kill by name instead of PID
pkill -f script.sh              # kill by matching against full command line
```

`pkill -f` is useful when a process has a long command line — you can match any part of it.


## The DD Command — Physical Drive Copies

`dd` creates bit-for-bit copies of storage devices. Every byte, including deleted files, slack space, and file system metadata.

### Copy a Drive to an Image File

```bash
sudo dd if=/dev/sda of=/path/to/image.img bs=4M
```

| Part | Meaning |
|---|---|
| `if=/dev/sda` | Input — the source drive |
| `of=/path/to/image.img` | Output — where the copy goes |
| `bs=4M` | Block size — 4MB chunks (faster than default) |

### Restore from an Image

```bash
sudo dd if=/path/to/image.img of=/dev/sda bs=4M
```

Just swap `if` and `of`.

### Why This Matters for Both Sides

**Red team:** After owning a target, `dd` lets you clone the entire drive — including anything that's been deleted — for offline analysis. You take everything with one command.

**Blue team / forensics:** Investigators use `dd` to make forensic copies before touching anything on a compromised machine. Working on the copy preserves the original evidence. Deleted files that haven't been overwritten are still recoverable from the image.


## Anonymity — AnonSurf and Tor

AnonSurf routes all your traffic through the Tor network, changing your apparent IP address.

```bash
sudo anonsurf start             # start routing through Tor
sudo anonsurf changeid          # request a new Tor identity (new IP)
sudo anonsurf stop              # stop routing through Tor
```

### Auto-Change IP Every 10 Seconds

```bash
sudo anonsurf start && sudo watch -n 10 gnome-terminal -- bash -c "sudo anonsurf changeid"
```

`watch -n 10` runs the command every 10 seconds. Each run opens a terminal that requests a new Tor identity. Keep the original terminal open — closing it stops the loop.

**Important:** Tor adds significant latency. Running `nmap` through Tor is impractical — scans become extremely slow. This is useful for browsing and manual testing, not automated scanning.


## Python Virtual Environments

When you're building tools in Python, virtual environments keep your dependencies isolated so you don't break system packages:

```bash
python3 -m venv venv            # create a virtual environment
source venv/bin/activate        # activate it (Linux)
pip install flask               # install packages inside the env
deactivate                      # exit the virtual environment
```

After activating, everything you install with `pip` stays inside the `venv` folder and doesn't touch the system Python. Useful when building custom tools for an engagement.


## Running Vulnerable Apps in Docker

For local lab practice:

```bash
# DVWA — Damn Vulnerable Web Application
docker run --rm -it -p 80:80 vulnerables/web-dvwa

# OWASP Juice Shop
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

Both give you intentionally vulnerable web applications to practice against locally without touching anything real.


## Quick Reference — Red Team Commands

| Task | Command |
|---|---|
| Disable command history | `HISTSIZE=0 && export HISTSIZE` |
| Delete bash history | `rm ~/.bash_history` |
| Hard kill a process by PID | `kill -9 [PID]` |
| Kill by name | `killall -9 [name]` |
| Clone a drive | `sudo dd if=/dev/sda of=/image.img bs=4M` |
| Find SUID files | `find / -user root -perm -4000 2>/dev/null` |
| Start Tor routing | `sudo anonsurf start` |
| Change Tor identity | `sudo anonsurf changeid` |
| Create Python venv | `python3 -m venv venv && source venv/bin/activate` |
| Find process by name | `ps -aux | grep name` |
| Shred a file | `shred filename` |