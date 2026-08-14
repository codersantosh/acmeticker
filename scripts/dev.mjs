import { context } from 'esbuild';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from './serve.mjs';

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

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2020',
  logLevel: 'info',
};

async function main() {
  rmSync('dist', { recursive: true, force: true });

  const contexts = [];
  for (const target of builds) {
    const ctx = await context({ ...shared, entryPoints: [entry], ...target });
    await ctx.watch();
    contexts.push(ctx);
  }

  const tscPath = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
  const tsc = spawn(
    process.execPath,
    [tscPath, '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'],
    { stdio: 'inherit' },
  );

  startServer();

  const shutdown = async () => {
    await Promise.all(contexts.map((ctx) => ctx.dispose()));
    tsc.kill('SIGINT');
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
