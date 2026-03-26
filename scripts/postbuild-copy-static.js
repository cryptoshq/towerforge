const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const distDir = path.join(root, 'dist');

const dirsToCopy = [
    { from: 'js', to: 'js', replace: true },
    { from: 'assets', to: 'assets', replace: false },
];

for (const entry of dirsToCopy) {
    const src = path.join(root, entry.from);
    if (!fs.existsSync(src)) continue;

    const dest = path.join(distDir, entry.to);
    if (entry.replace) {
        fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.cpSync(src, dest, { recursive: true, force: true });
}
