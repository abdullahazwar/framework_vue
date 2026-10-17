import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from '@vue/compiler-sfc';

const root = fileURLToPath(new URL('../', import.meta.url));
const problems = [];
let checked = 0;

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (/\.(vue|ts|html)$/.test(entry.name)) {
      checked++;
      const source = await readFile(path, 'utf8');
      const local = path.slice(root.length);
      if (
        /\bstyle\s*=|<style\b|\b(?:v-bind:|:)style\s*=|\.style\b|v-html\s*=|createElement\(['"]style/.test(
          source,
        )
      )
        problems.push(
          `${local}: CSS atau HTML mentah berada di kode antarmuka.`,
        );
      if (entry.name.endsWith('.vue')) {
        const result = parse(source, { filename: path });
        if (result.errors.length) problems.push(`${local}: SFC tidak valid.`);
        if (result.descriptor.styles.length)
          problems.push(`${local}: gunakan src/styles, bukan blok style.`);
      }
    }
  }
}

await scan(join(root, 'src'));
const index = await readFile(join(root, 'index.html'), 'utf8');
assert.match(
  index,
  /<link[\s\S]*?rel="stylesheet"[\s\S]*?href="\/src\/styles\/main.css"/,
);
assert.match(index, /<script[^>]*src="\/src\/main.ts"/);
assert.doesNotMatch(index, /<style\b|\bstyle\s*=/);
if (problems.length) throw new Error(problems.join('\n'));
console.log(`${checked} file sumber diperiksa; CSS terpisah dan SFC valid.`);
