import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const expectedAssets = [
  'background-shape.svg',
  'emphasis-scribble.svg',
  'macbook.png',
];
const distRoot = new URL('../dist/', import.meta.url);
const manifestPath = new URL('.vite/manifest.json', distRoot);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

for (const asset of expectedAssets) {
  const entry = Object.entries(manifest).find(([key]) =>
    key.endsWith(`/about/${asset}`),
  );
  if (!entry) throw new Error(`Missing About asset in build manifest: ${asset}`);
  const outputPath = new URL(entry[1].file, distRoot);
  if (!existsSync(outputPath))
    throw new Error(`Missing emitted About asset: ${entry[1].file}`);
}

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.svg']);
const pending = [fileURLToPath(distRoot)];
while (pending.length > 0) {
  const directory = pending.pop();
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      pending.push(path);
      continue;
    }
    if (!textExtensions.has(extname(path))) continue;
    const contents = readFileSync(path, 'utf8');
    if (/https?:\/\/[^"'\s]*(?:figma|mcp)/i.test(contents)) {
      throw new Error(`Forbidden remote design URL emitted in ${path}`);
    }
  }
}

console.log('Verified three local About assets and no remote Figma/MCP URLs.');
