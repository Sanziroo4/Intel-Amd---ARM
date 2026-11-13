import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const path of ['index.html', 'styles.css', 'app.js', 'assets']) await cp(path, `dist/${path}`, { recursive: true });
console.log('CHIP ATLAS → dist/ (relative asset paths; no runtime dependencies)');
