const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

const ASSET_ROUTES = new Map([
  ['/academia', '/academia/index.html'],
  ['/privacidad', '/privacidad.html'],
  ['/firma/isotipo-firma.png', '/firma/isotipo-firma.png'],
  ['/firma/logotipo-firma-claro.png', '/firma/logotipo-firma-claro.png'],
  ['/firma/logotipo-firma-oscuro.png', '/firma/logotipo-firma-oscuro.png'],
]);

// This is the exact retirement script from the former AGA landing Worker.
const RETIRE_SW = "self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));";

function reply(request, status, body, extraHeaders = {}) {
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return reply(request, 405, 'Método no permitido.', {
        Allow: 'GET, HEAD',
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }

    if (url.hostname === 'www.astrogecko.com') {
      url.protocol = 'https:';
      url.hostname = 'astrogecko.com';
      url.port = '';
      return reply(request, 301, null, { Location: url.href });
    }

    if (url.pathname === '/sw.js') {
      return reply(request, 200, RETIRE_SW, {
        'Content-Type': 'application/javascript; charset=utf-8',
      });
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return reply(request, 302, null, { Location: '/academia' + url.search });
    }

    if (url.pathname === '/academia/' || url.pathname === '/privacidad/') {
      url.pathname = url.pathname.slice(0, -1);
      return reply(request, 301, null, { Location: url.href });
    }

    const assetPath = ASSET_ROUTES.get(url.pathname);
    if (!assetPath) {
      return reply(request, 404, 'Página no encontrada.', {
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }

    const asset = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));
    if (!asset.ok) {
      return reply(request, 404, 'Página no encontrada.', {
        'Content-Type': 'text/plain; charset=utf-8',
      });
    }

    const isPng = url.pathname.startsWith('/firma/');
    return new Response(request.method === 'HEAD' ? null : asset.body, {
      status: asset.status,
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': isPng ? 'public, max-age=86400' : 'no-store',
        'Content-Type': isPng ? 'image/png' : 'text/html; charset=utf-8',
      },
    });
  },
};
