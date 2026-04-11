const fs = require('fs');
const path = require('path');

const projectRoot = path.join('c:', 'Users', 'K C T', '.gemini', 'antigravity', 'scratch', 'stager');

const dirs = [
    path.join(projectRoot, 'content', 'writeups'),
    path.join(projectRoot, 'content', 'blog')
];

for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const filePath = path.join(dir, file);
        let c = fs.readFileSync(filePath, 'utf-8');
        
        let lines = c.split(/\r?\n/);
        let newLines = [];
        let modified = false;

        let firstLine = lines.find(l => l.trim() !== '');
        let state = (firstLine && firstLine.trim() === '---') ? 0 : 2;
        
        for (let line of lines) {
            if (line.trim() === '---') {
                if (state === 0) {
                    state = 1;
                    newLines.push(line);
                } else if (state === 1) {
                    state = 2;
                    newLines.push(line);
                } else {
                    modified = true;
                }
            } else {
                newLines.push(line);
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
            console.log(`Cleaned ${path.basename(dir)}/${file}`);
        }
    }
}
console.log('done');
