---
title: "OpenVPN: Setting Up Your Own Private VPN Server on a VPS"
date: "2025-11-20"
description: "How OpenVPN server and client actually work, and a full walkthrough of setting up your own VPN on a VPS — SSH key auth, user setup, no-log config, and connecting from any machine."
tags: ["networking", "vpn", "linux", "privacy", "vps"]
---

## Server vs Client — Getting This Straight First

There's a distinction a lot of people miss when they first start working with OpenVPN.

When you install OpenVPN on an Ubuntu machine, that machine becomes an OpenVPN server. It's the entry point — it listens for incoming connections and controls what clients can access once they're connected. When someone on another machine imports a `.ovpn` file and connects, that second machine is the client. The `.ovpn` file is just a configuration file that tells the client how to reach the server, what credentials to use, and how to route traffic through the tunnel.

One server, many possible clients. The server doesn't move. Clients connect to it.

When the connection is established, a secure encrypted tunnel forms between client and server. What the client can reach through that tunnel depends entirely on how the server is configured. In a company environment, the server sits inside the company network, and employees connecting from home can access internal file shares, intranet sites, and internal apps as if they were sitting in the office. In a personal privacy setup, you run the server on a VPS in another country, and all your internet traffic exits through that VPS — websites see the VPS's IP, not yours.

Two scenarios, same technology, different configurations.

## What We're Building

This is a walkthrough of setting up a personal VPN on a VPS for privacy and IP change. The goals: your traffic is encrypted, your real IP is hidden, and the VPN keeps no logs of what you did.

## Step 1 — Create a Non-Root User on the VPS

The first thing you do after getting SSH access to a new VPS is stop using root. Create a real user, add them to a group with sudo access, and lock down root login.

```bash
useradd -m xarbi
passwd xarbi
groupadd wheel
usermod -G wheel xarbi
nano /etc/sudoers
```

In the sudoers file, find or add this line:

```
%wheel       ALL=(ALL)         ALL
```

Every user in the wheel group now has sudo access. Switch to the new user:

```bash
su xarbi
```

## Step 2 — Switch to SSH Key Authentication

Password authentication over SSH is a liability. Set up key-based auth and disable passwords entirely.

On your local machine (Windows, Linux, or Mac), generate an SSH key pair:

```bash
mkdir -p ~/.ssh
cd ~/.ssh
ssh-keygen -t rsa -b 4096
# Name the key (e.g. debvpn)
# Set a passphrase
```

This gives you two files: `debvpn` (private key, never share this) and `debvpn.pub` (public key, this goes to the server).

Transfer the public key to the VPS using SCP:

```bash
scp debvpn.pub xarbi@167.29.2.22:~
```

On the VPS, set it up as an authorized key:

```bash
mkdir ~/.ssh
touch ~/.ssh/authorized_keys
cat debvpn.pub >> ~/.ssh/authorized_keys
rm debvpn.pub
```

Now edit the SSH daemon config to disable passwords and root login:

```bash
sudo nano /etc/ssh/sshd_config
```

Make these changes:
- Set `PermitRootLogin` to `no`
- Uncomment `PubkeyAuthentication` and set it to `yes`
- Set `PasswordAuthentication` to `no`
- Uncomment `AuthorizedKeysFile`

Restart SSH:

```bash
sudo systemctl restart sshd
```

Exit and reconnect using your key:

```bash
ssh -i ~/.ssh/debvpn xarbi@167.29.2.22
# Enter your passphrase when prompted
```

If it works, root login is disabled, password auth is off, and you're only getting in with your key.

## Step 3 — Install OpenVPN Using angristan's Script

Installing OpenVPN manually involves generating a CA, server certificates, Diffie-Hellman parameters, and configuring iptables rules. The `openvpn-install` script by angristan handles all of that correctly in one run.

Get the script:

```bash
curl -LJO https://raw.githubusercontent.com/angristan/openvpn-install/master/openvpn-install.sh
chmod +x openvpn-install.sh
sudo ./openvpn-install.sh
```

The script asks you a few questions — server IP, port, DNS servers, client name. Answer them and it installs OpenVPN, generates all the cryptographic material, configures the firewall, and drops a `.ovpn` file in your home directory.

## Step 4 — Transfer the .ovpn to Your Local Machine

Use SFTP to download the client config file:

```bash
sftp -i ~/.ssh/debvpn xarbi@YOUR_VPS_IP
# You're now inside SFTP on the VPS
get clientname.ovpn
# File downloads to your current local directory
exit
```

## Step 5 — Disable Logging

By default, OpenVPN logs connection activity. If you want no logs:

```bash
sudo nano /etc/openvpn/server.conf
```

Find the line that says `verb 3` and change it to:

```
verb 0
```

Restart OpenVPN:

```bash
sudo systemctl restart openvpn
```

Verb 0 disables all logging. No connection timestamps, no IP records, nothing written to disk about what happened through the tunnel.

## Step 6 — Connect From Your Client Machine

On Linux:

```bash
sudo openvpn --config clientname.ovpn
```

On Windows, download the OpenVPN client, import the `.ovpn` file, and connect. Your traffic now exits through the VPS. Check your IP — it should show the VPS's IP and the VPS's country, not yours.

## How This Differs From a Corporate VPN

In a corporate setup, the OpenVPN server is inside the company network. When you connect, you get an internal IP and can reach internal resources — but your internet traffic still goes out through your local ISP. The tunnel is only for reaching the company network.

In this personal setup, the VPS is configured as a full internet gateway. All traffic — not just company resources — goes through the tunnel and exits through the VPS. That's the difference between a split-tunnel and a full-tunnel VPN configuration.

The `.ovpn` file the script generates routes all traffic through the server by default. If you want only specific traffic to go through the VPN and keep everything else local, you'd modify the `redirect-gateway` directive in the config — but for privacy purposes, full tunnel is what you want.