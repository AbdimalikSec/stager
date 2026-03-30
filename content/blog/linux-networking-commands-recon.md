---
title: "Linux Networking Commands: Everything You Need for Recon and Enumeration"
date: "2025-09-10"
description: "The networking commands I use constantly — finding IPs, checking open ports, firewall rules, DNS, and scanning. All with real examples."
tags: ["linux", "networking", "enumeration", "nmap", "recon"]
---

## The Network Is the Target

Whether you're doing recon on an external target or enumerating an internal network after getting a shell, these are the commands you'll reach for every time. Know them well enough that you don't have to think about the syntax.

---

## Finding Your Own IP Address

```bash
ifconfig                    # full interface info (old style)
ip a                        # modern way — shows all interfaces
hostname -i                 # quick local IP

# extract just the IP from eth0
ip address | grep eth0 | grep inet | awk '{print $2}'
```

The `awk '{print $2}'` at the end pulls just the IP/CIDR from the output instead of the full line.

---

## Interface Information

```bash
ifconfig            # shows interfaces, IPs, MAC addresses, packet stats
ip a                # same but more detailed — also shows routing and tunnel info
```

During a pentest, running `ip a` or `ifconfig` on a compromised machine immediately tells you:
- What network the machine is on
- Whether it has multiple interfaces (pivoting opportunity)
- The MAC address (useful for spoofing or identification)

---

## Checking Open Ports on Your Own Machine

Three ways, all useful:

```bash
netstat -tulpn                  # TCP/UDP listening ports with process names
ss -tulpn                       # faster modern alternative to netstat
nmap -sT localhost              # scan yourself
sudo ss -tuln | grep :22        # check if a specific port is open (22 = SSH)
```

`netstat -a | less` shows all connections including established ones — useful for seeing what's currently talking to what.

---

## Checking Services

```bash
systemctl status ssh                            # is SSH running?
sudo systemctl start apache2                    # start a service
sudo systemctl restart ssh                      # restart a service
systemctl list-units --type=service | grep ssh  # find a service by name
```

---

## DNS

```bash
cat /etc/resolv.conf        # your configured DNS servers (old way)
resolvectl status           # better — shows DNS servers per interface
```

---

## Connectivity Testing

```bash
ping -c 5 google.com            # send 5 pings to check if host is up
traceroute google.com           # show every hop between you and the target
```

`traceroute` is useful for understanding network topology — which routers sit between you and a target, where traffic is being filtered, and approximate network distances.

---

## Firewall — UFW

`iptables` is powerful but complex. `ufw` (Uncomplicated Firewall) is the practical daily tool:

```bash
sudo ufw status                         # see what's currently allowed
sudo ufw allow 80                       # allow HTTP traffic
sudo ufw allow from any to any port 22  # allow SSH from anywhere
sudo ufw disable                        # turn off firewall entirely

# advanced iptables if needed
sudo iptables -I INPUT -p tcp -m tcp --dport 80 -j ACCEPT
```

During a lab when you need to receive reverse shells or serve files, you'll often need to temporarily allow a port. `ufw allow [port]` is the quick way.

---

## Nmap — Network Scanning

```bash
sudo nmap -T4 -p- -A 192.168.100.5     # full aggressive scan, all ports
nmap -sT -Pn -n --top-ports 100 10.10.1.200    # top 100 ports, no ping, no DNS
nmap -sT localhost                              # scan your own machine
```

Flag breakdown:
- `-T4` — aggressive timing (faster)
- `-p-` — scan all 65535 ports
- `-A` — OS detection, version detection, scripts, traceroute
- `-Pn` — skip host discovery (treat host as up even if ping is blocked)
- `-n` — no DNS resolution (faster)

---

## Subdomain Enumeration

```bash
sublist3r -d hormuud.com        # find subdomains of a target domain
```

Sublist3r queries multiple sources — search engines, certificate transparency logs, DNS brute force — and aggregates results. Useful for external recon before touching the target.

---

## Website Availability

```bash
ping -c 5 baxarflow.com             # basic up/down check
traceroute baxarflow.com            # path to the website
wget https://example.com/file.pdf   # download a file from a URL
curl https://example.com > page.html # download and save a URL
```

---

## Netstat Reference

```bash
netstat                 # all network connections
netstat -a | less       # all connections paginated
netstat -tulpn          # listening ports with process info
```

`netstat` shows:
- Active TCP/UDP connections
- Routing tables
- Network protocol statistics

During post-exploitation on a Windows or Linux machine, `netstat -tulpn` immediately tells you what services are listening locally — which is how you find things like MySQL on `127.0.0.1:3306` or internal web apps on non-standard ports that aren't visible from outside.

---

## Checking Processes and Connections Together

```bash
ps -aux                         # all running processes
ps -aux | grep script.sh        # find a specific process
top                             # live process viewer
htop                            # better looking live process viewer
sudo apt install htop           # install it if not present
```

---

## What's Next

The next post covers the red team side — covering tracks, anonymity, the `dd` command for forensic copies, process killing, and how SUID permissions become an actual privilege escalation path.