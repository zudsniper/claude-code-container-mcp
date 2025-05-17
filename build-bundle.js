import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// First remove the shebang from the source if it exists
const source = readFileSync('src/server.ts', 'utf8');
const sourceWithoutShebang = source.replace(/^#!.*\n/, '');
const writeFileSync = await import('fs').then(fs => fs.writeFileSync);
writeFileSync('src/server-temp.ts', sourceWithoutShebang);

await esbuild.build({
  entryPoints: ['src/server-temp.ts'],
  bundle: true,
  outfile: 'dist/server.js',
  platform: 'node',
  target: 'node20',
  format: 'esm',
  banner: {
    js: '#!/usr/bin/env node'
  },
  external: [
    'node:*',
    'path',
    'fs',
    'os',
    'child_process'
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  minify: false,
  sourcemap: false,
  keepNames: true,
  packages: 'bundle'
});

// Clean up temp file
const unlinkSync = await import('fs').then(fs => fs.unlinkSync);
unlinkSync('src/server-temp.ts');

console.log('Bundle created successfully!');