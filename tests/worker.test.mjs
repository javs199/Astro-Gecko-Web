import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const ORIGIN = 'https://astrogecko.com';
const SECURITY = [
  'x-content-type-options',
  'referrer-policy',
  'content-security-policy',
];
const allowedFiles = new Set([
  '/academia/index.html',
  '/privacidad.html',
  '/firma/isotipo-firma.png',
  '/firma/logotipo-firma-claro.png',
  '/firma/logotipo-firma-oscuro.png',
]);

function fixture() {
  const requests = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        requests.push(pathname);
        // A fake ASSETS binding that serves only the committed public files.
        if (!allowedFiles.has(pathname)) {
          return new Response('Not found', { status: 404 });
        }
        try {
          const bytes = await readFile(join(PUBLIC, pathname.slice(1)));
          return new Response(request.method === 'HEAD' ? null : bytes, {
            headers: {
              'Content-Type': pathname.endsWith('.png')
                ? 'image/png'
                : 'text/html; charset=utf-8',
            },
          });
        } catch (error) {
          if (error.code === 'ENOENT') {
            return new Response('Not found', { status: 404 });
          }
          throw error;
        }
      },
    },
  };
  return {
    requests,
    async fetch(path, method = 'GET') {
      const url = path.startsWith('https://') ? path : ORIGIN + path;
      return worker.fetch(new Request(url, { method }), env);
    },
  };
}

function assertSecurity(response, cache = 'no-store') {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(response.headers.get('cache-control'), cache);
  const csp = response.headers.get('content-security-policy');
  assert.ok(csp?.includes("default-src 'none'"));
  assert.ok(csp?.includes("img-src 'self' data:"));
  assert.ok(csp?.includes("frame-ancestors 'none'"));
}

test('la portada es pública y no expone rutas ni datos académicos privados', async () => {
  const context = fixture();
  const response = await context.fetch('/academia');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assertSecurity(response);
  const html = await response.text();
  assert.match(html, /Iniciar sesión con Google/);
  assert.match(html, /href="\/privacidad"/);
  assert.match(html, /https:\/\/app\.astrogecko\.com\//);
  assert.match(html, /class="brand" href="\/academia"/);
  for (const forbidden of ['notion.so', 'notebook.google', 'gmail.com', 'data.json']) {
    assert.ok(!html.includes(forbidden), 'Se encontró contenido privado: ' + forbidden);
  }
  assert.deepEqual(context.requests, ['/academia/index.html']);
});

test('la política mantiene su URL y no carga contenido de la app', async () => {
  const context = fixture();
  const portada = await context.fetch('/academia');
  const response = await context.fetch('/privacidad');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  for (const name of [...SECURITY, 'cache-control', 'content-type']) {
    assert.equal(response.headers.get(name), portada.headers.get(name), name);
  }
  const html = await response.text();
  assert.match(html, /Política de privacidad/);
  assert.match(html, /class="brand" href="\/academia"/);
  assert.match(html, /href="\/academia">Volver al inicio/);
  // The header's sign-in button is the privacy page's sole allowed app link.
  const withoutLogin = html.replace(/<a\s+class="header-login"[^>]*>[\s\S]*?<\/a>/g, '');
  for (const forbidden of ['app.astrogecko.com', 'data.json', 'notion.so', 'notebooklm']) {
    assert.ok(!withoutLogin.includes(forbidden), 'Se encontró contenido privado: ' + forbidden);
  }
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<img'));
  assert.deepEqual(context.requests, ['/academia/index.html', '/privacidad.html']);
});

test('las redirecciones conservan las consultas y la URL de privacidad', async () => {
  const context = fixture();
  for (const start of ['/', '/index.html']) {
    const response = await context.fetch(start);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), '/academia');
    assertSecurity(response);
  }
  for (const [start, expected] of [
    ['/academia/?x=1', ORIGIN + '/academia?x=1'],
    ['/privacidad/?lang=es', ORIGIN + '/privacidad?lang=es'],
    ['https://www.astrogecko.com/privacidad?a=1', ORIGIN + '/privacidad?a=1'],
  ]) {
    const response = await context.fetch(start);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), expected);
    assertSecurity(response);
  }
  assert.deepEqual(context.requests, []);
});

test('las imágenes de firma sirven los mismos bytes que los archivos versionados', async () => {
  const context = fixture();
  for (const name of [
    'isotipo-firma.png',
    'logotipo-firma-claro.png',
    'logotipo-firma-oscuro.png',
  ]) {
    const pathname = '/firma/' + name;
    const response = await context.fetch(pathname);
    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assertSecurity(response, 'public, max-age=86400');
    const expected = await readFile(join(PUBLIC, 'firma', name));
    const actual = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(actual, expected);
  }
  assert.equal(context.requests.length, 3);
});

test('solo se sirven las rutas públicas explícitamente permitidas', async () => {
  const context = fixture();
  for (const path of [
    '/data.json',
    '/app.js',
    '/manifest.webmanifest',
    '/privacidad.html',
    '/academia/index.html',
    '/firma/',
    '/firma/otro.png',
  ]) {
    const response = await context.fetch(path);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(await response.text(), 'Página no encontrada.');
    assertSecurity(response);
  }
  assert.deepEqual(context.requests, []);
});

test('el Worker rechaza POST antes de acceder a los assets', async () => {
  const context = fixture();
  const response = await context.fetch('/academia', 'POST');
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
  assert.equal(await response.text(), 'Método no permitido.');
  assertSecurity(response);
  assert.deepEqual(context.requests, []);
});

test('HEAD conserva las cabeceras y elimina el cuerpo', async () => {
  const context = fixture();
  for (const path of ['/academia', '/privacidad', '/firma/isotipo-firma.png', '/', '/sw.js', '/no-existe']) {
    const response = await context.fetch(path, 'HEAD');
    assert.equal(await response.text(), '');
    assert.equal(response.body, null);
    assertSecurity(response, path.endsWith('.png') ? 'public, max-age=86400' : 'no-store');
    if (path === '/academia') assert.equal(response.status, 200);
  }
});

test('el service worker anterior se retira sin cachear contenido', async () => {
  const context = fixture();
  const response = await context.fetch('/sw.js');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/javascript; charset=utf-8');
  assertSecurity(response);
  const script = await response.text();
  assert.match(script, /registration\.unregister\(\)/);
  assert.match(script, /skipWaiting\(\)/);
  assert.deepEqual(context.requests, []);
});
