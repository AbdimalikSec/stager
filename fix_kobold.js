const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'K C T', '.gemini', 'antigravity', 'scratch', 'stager', 'content', 'writeups', 'kobold.md');
let c = fs.readFileSync(file, 'utf-8');

c = c.replace(/Here is your corrected and complete writeup:[\s\r\n]*---[\s\r\n]*# Kobold[\s\r\n]*\*\*By Stager\*\* \| FashilHack[\s\r\n]*---/m, `---
title: "Kobold"
date: "2026-04-11"
description: "Kobold is a web-focused Linux box on HackTheBox that revolves around modern web application behavior — specifically a frontend-heavy SPA backed by an API."
tags: ["linux", "hackthebox", "writeup", "cve-2026-23520", "docker-breakout", "privilege-escalation"]
---

**By Stager** | FashilHack`);

let lines = c.split(/\r?\n/);
let newLines = [];
let frontmatterLinesCount = 0;
for(let line of lines) {
    if (line.trim() === '---') {
        // Keep the first two '---' which are our newly added frontmatter boundaries.
        // We ensure they are at the top (within first 10 lines to be safe).
        if (frontmatterLinesCount < 2 && newLines.length < 10) {
            frontmatterLinesCount++;
            newLines.push(line);
        } else {
            // strip it!
        }
    } else {
        newLines.push(line);
    }
}
c = newLines.join('\n');

// fix images: ![[some/path/image.png]] -> ![Screenshot](/writeups/kobold/image.png)
c = c.replace(/!\[\[(.*?)\]\]/g, (match, p1) => {
    let basename = p1.split('/').pop().split('\\').pop();
    let encoded = basename.split(' ').join('%20');
    return `![Screenshot](/writeups/kobold/${encoded})`;
});

fs.writeFileSync(file, c, 'utf-8');
console.log('Successfully formatted kobold.md');
