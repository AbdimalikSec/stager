---
title: "HTB: Machines Walkthrough"
date: "2025-11-01"
description: "My solution for the Machines box on HackTheBox."
tags: ["htb", "writeup", "linux"]
---

# HTB: Machines

This was an easy box involving a simple SQL injection and a kernel exploit.

## Recon

Started with Nmap:

```bash
nmap -sC -sV -oA nmap/machines 10.10.10.10
```

## User Flag

Found a web server running on port 80...
