---
title: "Linux Fundamentals: Filesystem, Commands, and Finding Your Way Around"
date: "2025-09-01"
description: "A practical breakdown of the Linux filesystem, essential commands, and how to navigate and manipulate files like you actually know what you're doing."
tags: ["linux", "fundamentals", "commands", "beginner"]
---

## Why This Matters

Every pentest, every CTF, every real engagement happens on Linux or against systems you access through Linux. If you're slow on the command line, you're slow everywhere. This is the foundation everything else builds on.

These notes come from real practice — OverTheWire wargames, lab work, and building tools from scratch. Not theory. Things I actually typed and used.


## The Linux Filesystem — What Lives Where

Before you touch a single command, understand where things are. Linux isn't random. Every directory has a purpose.

| Directory | What's In It |
|---|---|
| `/bin` | Executable binaries everyone can use — `cp`, `rm`, `cat`, `ls` |
| `/sbin` | Admin-only binaries — commands only root should run |
| `/usr/local` | Where you store custom command binaries you create |
| `/lib` | Shared libraries that binaries depend on |
| `/boot` | Files needed to boot the system |
| `/var` | Log files and web application files |
| `/tmp` | Temporary files — cleared on reboot |
| `/dev` | Devices — `sda` is a disk, `vda`/`vda1` are virtual drives |
| `/etc` | System-wide config — network settings, installed software config |
| `/proc` | Virtual files containing info about running processes and resources |

The ones you'll use most during a pentest: `/etc`, `/var`, `/tmp`, `/dev`, `/proc`.


## Reading a File Listing

Run `ls -la` and you get something like this:

```
drwxr-xr-x  2 kali kali 4096 Sep  1 10:00 tools
lrwxrwxrwx  1 kali kali   12 Sep  1 10:00 shortcut -> /etc/passwd
-rw-r--r--  1 kali kali  512 Sep  1 10:00 notes.txt
```

The first character tells you what it is:
- `d` — directory
- `l` — symbolic link
- `-` — regular file

The next 9 characters are permissions in three groups of three — owner, group, everyone else. Each group is `rwx` (read, write, execute). A `-` means that permission is not set.

So `-rw-r--r--` means:
- Owner: read + write, no execute
- Group: read only
- Everyone: read only


## Essential Commands You'll Use Every Day

### Viewing Files and Directories

```bash
ls -la          # list everything including hidden files with details
ls -lah         # same but file sizes shown as human readable (KB, MB)
cat file.txt    # print file contents to terminal
head file.txt   # show first 10 lines only
```

### Creating and Editing Files

```bash
echo "text" > file.txt      # create file and write text (overwrites)
echo "text" >> file.txt     # append to existing file
cat > file.txt              # type content interactively, exit with Ctrl+D
touch file.txt              # create empty file
touch saacid{1..10}         # create 10 files: saacid1, saacid2... saacid10
vim file.txt                # open in vim — press i to insert, Esc then :wq to save
```

`>` overwrites. `>>` appends. Remember that.

### Copying, Moving, Renaming

```bash
cp file.txt /tmp/           # copy file to /tmp
mv file.txt newname.txt     # rename file
mv *.sh bash/               # move all .sh files into bash folder
```

### Finding Files

```bash
sudo find / -name "file.txt"        # find file anywhere on system
sudo find . -type f -name ".*"      # find hidden files
find . -type f -empty               # find empty files
find . -perm /a=x                   # find executable files
```

### Text Manipulation

```bash
grep "pattern" file.txt             # find lines matching pattern
cat file.txt | sort                 # sort lines alphabetically
wc -l file.txt                      # count lines in file
wc -w file.txt                      # count words
ls -al | wc                         # count items in directory listing
cat file1.txt file2.txt > both.txt  # combine two files into one
diff file1.txt file2.txt            # show differences between files
cmp file1.txt file2.txt             # check if two files are identical
```

### Archiving and Compressing

```bash
tar -cvf archive.tar file1 file2 file3    # bundle files together
tar -tvf archive.tar                       # view contents without extracting
tar -xf archive.tar                        # extract silently
gzip archive.tar                           # compress the archive
```


## Shell Basics

```bash
echo $SHELL         # which shell are you using
cat /etc/shells     # all available shells on the system
chsh -s /bin/bash   # change your shell to bash
```

Setting a variable to the output of a command:

```bash
result=$(whoami)
echo $result
```


## Locating Binaries

```bash
whereis nmap    # shows all locations of nmap (binary, man page, source)
which nmap      # shows which nmap runs when you type it (based on PATH)
```

`which` tells you what actually runs. `whereis` tells you everywhere it exists.


## System Information

```bash
uname -a        # kernel and system info
neofetch        # pretty system summary
uptime          # how long the system has been running
free            # RAM usage
df -h           # disk space usage (human readable)
lsblk           # list block devices (disks)
sudo fdisk -l   # detailed disk partition info
cal             # calendar
date            # current date and time
```


## Shredding a File

If you want to make a file unrecoverable — not just deleted but actually overwritten:

```bash
shred filename
```

Standard `rm` just removes the pointer to the file. The data stays on disk until overwritten. `shred` overwrites the data multiple times first.


## Symbolic Links

Create a link that points to another file:

```bash
ln -s filename linkname
```

The link appears in `ls -la` with `l` at the start and shows where it points with `->`.


## Removing Files and Directories

```bash
rm file.txt             # delete a file
rm -r foldername        # delete a folder and everything in it
```

Non-empty directories need `-r`. No recycle bin on Linux — it's gone.


## What's Next

This covers the foundation. The next post goes into permissions and user management in depth — including how SUID bits create privilege escalation opportunities, which is where this knowledge starts to get offensive.