import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const watchOption = watch ? { watch: true } : {};

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2020',
  logLevel: 'info',
  ...watchOption,
};

const entry = 'src/index.ts';

const umdFooter =
  'AcmeTicker = Object.assign(AcmeTicker.AcmeTicker, AcmeTicker);';

const builds = [
  { format: 'esm', outfile: 'dist/acmeticker.esm.js' },
  { format: 'esm', minify: true, outfile: 'dist/acmeticker.esm.min.js' },
  { format: 'cjs', outfile: 'dist/acmeticker.cjs' },
  { format: 'cjs', minify: true, outfile: 'dist/acmeticker.cjs.min.js' },
  {
    format: 'iife',
    globalName: 'AcmeTicker',
    footer: { js: umdFooter },
    outfile: 'dist/acmeticker.umd.js',
  },
  {
    format: 'iife',
    globalName: 'AcmeTicker',
    footer: { js: umdFooter },
    minify: true,
    outfile: 'dist/acmeticker.umd.min.js',
  },
];

const jqueryEntry = 'src/jquery.ts';

const jqueryBuilds = [
  { format: 'esm', outfile: 'dist/acmeticker.jquery.esm.js' },
  { format: 'cjs', outfile: 'dist/acmeticker.jquery.cjs' },
  { format: 'iife', outfile: 'dist/acmeticker.jquery.js' },
  { format: 'iife', minify: true, outfile: 'dist/acmeticker.jquery.min.js' },
];

async function main() {
  rmSync('dist', { recursive: true, force: true });

  for (const target of builds) {
    await build({ ...shared, entryPoints: [entry], ...target });
  }
  for (const target of jqueryBuilds) {
    await build({ ...shared, entryPoints: [jqueryEntry], ...target });
  }

  if (!watch) {
    execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
