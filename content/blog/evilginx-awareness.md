---
title: "Evilginx Phishing Project"
date: "2025-10-15"
description: "An educational project documenting the setup and workflow of an Evilginx lab environment."
tags: ["project", "lab", "phishing"]
---

# Evilginx Lab Notes (Educational)

## Explanation

These notes document a **lab-based project** carried out to understand how phishing infrastructure is set up and how different components (VPS, domain, DNS, phishlets, and lures) work together.

The purpose of organizing these notes is **learning and documentation**:
- To understand the flow of a phishing framework in a controlled environment
- To clearly see the role of DNS, domains, and subdomains
- To document what happens at each stage of the setup

This is not meant to be used against real users or systems.

---

## Steps (Lab Setup Notes)

- Set up a VPS on DigitalOcean or any cloud provider you like
- Download and install Evilginx on the VPS
- Buy a domain from Namecheap or use a free domain provider
- Point the domain to the VPS machine
- Add the domain to the Evilginx configuration file in `/root/.evilginx`
- Register the domain in Cloudflare and manage DNS records there
- (Optional) Register the domain email using Zoho
- Install phishlets on the VPS  
- Add **A records** for phishlet subdomains in DNS  
- Set up a WordPress-style login page using a phishlet  
- Create a lure (a unique URL that loads the login page)
- Test the lure flow in a controlled lab environment

## Conclusion

This lab helped document the full flow of a phishing framework from setup to testing within a controlled environment. Writing these notes in an organized way makes it easier to review the process, understand how the components connect, and reference the setup later for learning or research purposes.
