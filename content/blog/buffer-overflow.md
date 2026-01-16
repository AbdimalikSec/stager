---
title: "Understanding Buffer Overflows"
date: "2025-10-15"
description: "A deep dive into the stack layout and how we can abuse it to execute arbitrary code."
tags: ["binary-exploitation", "pwn", "c"]
---

# Buffer Overflows 101

Welcome to my first blog post. Today we enter the matrix of memory corruption.

## The Stack

The stack is a LIFO (Last In, First Out) data structure...

```c
void vulnerable() {
    char buffer[64];
    gets(buffer); // Dangerous!
}
```

The `gets` function doesn't check the length of input...
