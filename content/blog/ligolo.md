---
title: "Ligolo Project: Tunneling & Pivoting Explained"
date: "2025-10-15"
description: "An educational blog explaining how Ligolo is used for tunneling and pivoting during internal network assessments."
tags: ["project", "network-security", "pivoting", "red-team"]
---

# Ligolo Project: Tunneling & Pivoting Explained

## Introduction

This project documents how **Ligolo** is used in a lab environment to create a tunnel between an attacker machine and a compromised system, allowing access to internal networks that are otherwise unreachable.

The goal of this blog is **education and understanding**, not misuse.  
Ligolo is commonly discussed in:
- Red team labs
- Penetration testing training
- Internal network security assessments

---

## Project Overview

Ligolo works using a **proxy–agent model**:

- The **proxy** runs on the attacker machine (Linux / Kali)
- The **agent** runs on the target system (Windows or Linux)
- A secure tunnel is established between them
- Traffic is routed through a virtual network interface

This allows the attacker machine to **reach internal subnets** behind the target system.

---

## Environment Preparation

The project begins by preparing both components:

- The **proxy** is extracted and run on the Linux attacker machine
- The **agent** binary is prepared to run on the target system
- Both components must be compatible with their operating systems

At this stage, no tunneling exists yet — only the tools are ready.

---

## Network Interface Setup (Attacker Side)

On the attacker machine:

- A **TUN interface** is created
- This interface acts as a virtual network card
- It will later be used to route traffic into the internal network

Bringing the interface up allows the operating system to recognize it as a valid routing destination.

---

## Starting the Ligolo Proxy

Once the interface is ready:

- The Ligolo proxy is started
- A self-signed certificate is generated
- The proxy begins listening on a specific port

This proxy waits for incoming agent connections.

---

## Agent Connection (Target Side)

On the target system:

- The Ligolo agent is executed
- It connects back to the proxy using the proxy’s IP and port
- Certificate verification is ignored in lab scenarios

Once connected, the proxy confirms that a session has been established.

---

## Session Handling

After a successful connection:

- The proxy shows an active session
- The operator selects the session to interact with
- This links the target system to the attacker’s tunnel interface

At this point, the tunnel exists but **no routing is active yet**.

---

## Internal Network Enumeration

From the target system:

- Network configuration is inspected
- Multiple network adapters may be discovered
- One adapter often belongs to an **internal network**

This internal network is the primary pivoting target.

---

## Routing Internal Networks

Once the internal subnet is identified:

- A route is added on the attacker machine
- The route points the internal subnet through the Ligolo TUN interface
- This tells the system where internal traffic should go

After routing is added, traffic destined for the internal network flows through the tunnel.

---

## Activating the Tunnel

Finally:

- The tunnel is started inside Ligolo
- The routing becomes active
- The attacker machine can now communicate with internal hosts

This completes the pivoting process.

---

## Conclusion

This project demonstrates how Ligolo enables tunneling and pivoting by combining:

- A proxy–agent architecture
- Virtual network interfaces
- OS-level routing
- Session-based control

Understanding this workflow is important for both:
- **Attack simulation (red team labs)**
- **Defense and detection (blue team awareness)**

Knowing how pivoting works helps defenders recognize unusual routing behavior, tunneling traffic, and internal reconnaissance.
