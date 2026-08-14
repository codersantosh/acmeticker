import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2020',
  logLevel: 'info',
};

const entry = 'src/index.ts';

const globalFooter =
  'AcmeTicker = Object.assign(AcmeTicker.AcmeTicker, AcmeTicker);';

const builds = [
  { format: 'esm', outfile: 'dist/acmeticker.esm.js' },
  { format: 'esm', minify: true, outfile: 'dist/acmeticker.esm.min.js' },
  { format: 'cjs', outfile: 'dist/acmeticker.cjs' },
  { format: 'cjs', minify: true, outfile: 'dist/acmeticker.min.cjs' },
  {
    format: 'iife',
    globalName: 'AcmeTicker',
    footer: { js: globalFooter },
    outfile: 'dist/acmeticker.js',
  },
  {
    format: 'iife',
    globalName: 'AcmeTicker',
    footer: { js: globalFooter },
    minify: true,
    outfile: 'dist/acmeticker.min.js',
  },
];

async function main() {
  rmSync('dist', { recursive: true, force: true });

  for (const target of builds) {
    await build({ ...shared, entryPoints: [entry], ...target });
  }

  execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
