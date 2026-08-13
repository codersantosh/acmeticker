import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number.parseInt(process.env.PORT ?? '8080', 10);
const ROOT = process.cwd();

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.d.ts': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

export function startServer(port = PORT) {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
    const requested = normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = resolve(join(ROOT, requested));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const finalPath = existsSync(filePath) && statSync(filePath).isDirectory()
      ? join(filePath, 'index.html')
      : filePath;

    if (!existsSync(finalPath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(finalPath)] ?? 'application/octet-stream',
    });
    createReadStream(finalPath).pipe(res);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use - set PORT to another value, e.g. PORT=8081`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`Serving ${ROOT} at http://localhost:${port}/`);
    console.log('Examples:');
    console.log(`  http://localhost:${port}/examples/vertical.html`);
    console.log(`  http://localhost:${port}/examples/horizontal.html`);
    console.log(`  http://localhost:${port}/examples/marquee.html`);
    console.log(`  http://localhost:${port}/examples/typewriter.html`);
  });

  return server;
}

const isMain =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  startServer();
}
