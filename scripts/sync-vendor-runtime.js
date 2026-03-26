const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const vendorDir = path.join(root, 'js', 'vendor');

const copies = [
    {
        from: path.join(root, 'node_modules', 'peerjs', 'dist', 'peerjs.min.js'),
        to: path.join(vendorDir, 'peerjs.min.js'),
    },
    {
        from: path.join(root, 'node_modules', 'pixi.js', 'dist', 'pixi.min.js'),
        to: path.join(vendorDir, 'pixi.min.js'),
    },
];

fs.mkdirSync(vendorDir, { recursive: true });

for (const copy of copies) {
    if (!fs.existsSync(copy.from)) {
        throw new Error(`Missing vendor dependency: ${copy.from}`);
    }
    fs.copyFileSync(copy.from, copy.to);
}
