import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, '.github', 'project', 'wiki');
const destination = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'wiki');

if (!fs.existsSync(source)) {
  throw new Error(`Wiki source not found: ${source}`);
}

fs.mkdirSync(destination, { recursive: true });

for (const file of fs.readdirSync(source)) {
  if (!file.endsWith('.md')) continue;
  fs.copyFileSync(path.join(source, file), path.join(destination, file));
  console.log(`Copied wiki page ${file}`);
}
