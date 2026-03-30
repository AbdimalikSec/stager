---
title: "RustDesk: Self-Hosted Remote Desktop Over LAN and the Internet"
date: "2025-11-25"
description: "How I set up RustDesk for local network remote access and then extended it to work anywhere using a self-hosted relay server on a VPS."
tags: ["networking", "remote-access", "rustdesk", "vps", "linux"]
---

## What RustDesk Is

RustDesk is an open-source remote desktop tool — think TeamViewer or AnyDesk, but you control the infrastructure. No third-party servers handling your traffic, no subscription, no sending your screen through someone else's cloud. You can run it purely on your own machines.

It works in two modes depending on where the machines are. If both machines are on the same local network, you connect directly. If they're on different networks — one at home, one somewhere else — you need a relay server in the middle to broker the connection. That relay is what we're setting up here.

## LAN Setup — Same Network

When both machines are on the same local network, the setup is almost nothing.

On both machines, open RustDesk settings and enable direct IP connection. Set a permanent password on each machine so you don't have to deal with one-time codes. Then connect using the ID shown in RustDesk on the target machine.

That's it. No server, no VPS, no configuration files. RustDesk handles the discovery and connection directly over the local network.

The permanent password matters if you want to connect without someone sitting at the other machine to approve the session. Set it, note it down, and you can connect any time the machine is on.

## Remote Setup — Across the Internet

When the machines are on different networks, direct connection doesn't work. RustDesk needs a relay server — a machine with a public IP that both clients can reach. You host this yourself on a VPS.

### Step 1 — Set Up the VPS

Rent any VPS — DigitalOcean, Linode, Vultr, whatever. Ubuntu works fine. You need a machine with a stable public IP.

SSH into it and install the RustDesk server using the community install script:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/techahold/rustdeskinstall/master/install.sh)
```

The script handles everything — installs `hbbs` (the ID/rendezvous server) and `hbbr` (the relay server), sets up systemd services so they start on boot, and generates your public key.

After it finishes, note down two things:

```
Your IP/DNS Address: 164.92.132.195
Your public key: WwZ2Mj1qQ5Kx+gQzJKEuB31DMrQXv8RjjAc+twWxSJE=
```

The public key is how clients verify they're talking to your server and not someone pretending to be it.

### Step 2 — Configure Both Client Machines

On every machine that needs to connect through your relay — both the machine you're controlling and the machine doing the controlling — open RustDesk, go to Settings → Network, and fill in:

- **ID Server**: your VPS IP
- **Relay Server**: your VPS IP (same IP, both fields)
- **Public Key**: the key the install script gave you

Save and restart RustDesk on both machines.

### Step 3 — Connect

Now open RustDesk on the controlling machine, enter the ID of the machine you want to reach, and connect. The relay server on your VPS brokers the connection. Neither machine needs a direct route to the other — they both just need to reach the VPS.

## Why Self-Host Instead of Using RustDesk's Public Servers

RustDesk offers free public relay servers. They work. But your traffic goes through their infrastructure, which means you're trusting a third party with whatever is on your screen.

Running your own relay means the relay server only sees encrypted traffic — and it's your server, on your VPS, under your control. For any security-sensitive use — accessing a work machine, accessing lab environments, anything you'd rather not route through a stranger's server — self-hosting is the right call.

The VPS cost is usually $4-6 per month for a basic droplet. For what you get — full control, no subscription, works from anywhere — it's worth it.

## Troubleshooting — Connection Not Working

If clients can't reach the relay, check that the required ports are open on the VPS firewall. RustDesk needs ports 21115-21119 TCP and 21116 UDP. On Ubuntu with UFW:

```bash
sudo ufw allow 21115:21119/tcp
sudo ufw allow 21116/udp
sudo ufw reload
```

If the public key is wrong on either client, the connection will be rejected. Double-check the key matches exactly what the install script printed — copy-paste errors here are common.

If the service isn't running after a reboot, check:

```bash
sudo systemctl status hbbs
sudo systemctl status hbbr
```

Both should show active. If not, the install script may not have registered the services correctly — rerun it.