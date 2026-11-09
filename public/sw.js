/*
 * Service worker för Engelskajakten.
 *
 * Syftet är skolans nät: en klass som startar appen samtidigt på ett trådlöst
 * nät som svajar. Appens filer sparas på enheten, så att den startar även när
 * nätet är segt eller borta en stund.
 *
 * En service worker som sparar fel är värre än ingen alls – då sitter eleverna
 * fast i en gammal version. Strategierna är valda för att det inte ska kunna
 * hända:
 *
 *   sidhämtning (navigering)  nätet först. Den sparade sidan används bara när
 *                             nätet inte svarar alls.
 *   /_next/static/*, /sprites/* och innehållsfiler med hash i namnet
 *                             det sparade först. Namnet ändras när innehållet
 *                             ändras, så en sparad fil kan aldrig vara fel
 *                             version.
 *   bilder                    det sparade först, och en färsk kopia hämtas i
 *                             bakgrunden till nästa gång.
 *   /api/* och allt annat     rörs inte.
 *
 * Bara lyckade svar som inte är HTML sparas som filer, så en felsida kan
 * aldrig sparas som om den vore en skriptfil. Elevernas framsteg ligger i
 * webbläsarens localStorage och berörs inte av det här.
 */

// Höj siffran för att kasta allt som sparats och börja om.
const VERSION = 'engelskajakten-v1';
const SIDOR = `${VERSION}-sidor`;
const FILER = `${VERSION}-filer`;
const BILDER = `${VERSION}-bilder`;

// Filer vars namn bär en hash av innehållet.
function arOforanderlig(sokvag) {
  return (
    sokvag.startsWith('/_next/static/') ||
    sokvag.startsWith('/sprites/') ||
    /^\/content\/[^/]+\/[a-z]+-[0-9a-f]{8,}\.json$/.test(sokvag)
  );
}

function arBild(sokvag) {
  return /\.(png|webp|jpe?g|svg|ico|gif)$/i.test(sokvag);
}

// Sant för svar som är värda att spara som filer: lyckade, och inte en
// HTML-sida som skickats i stället för filen som efterfrågades.
function sparbar(svar) {
  if (!svar || !svar.ok || svar.type !== 'basic') return false;
  return !(svar.headers.get('content-type') || '').includes('text/html');
}

// Sidor sparas per sökväg, utan frågesträng.
function sidnyckel(url) {
  return url.origin + url.pathname;
}

self.addEventListener('install', (event) => {
  // Den nya versionen tar över direkt, utan att eleven behöver stänga fliken.
  self.skipWaiting();
  event.waitUntil(
    caches.open(SIDOR).then((cache) => cache.add('/')).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const namn = await caches.keys();
      await Promise.all(namn.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

// Första besöket laddas innan service workern har tagit över, så de filerna
// går aldrig genom fetch-lyssnaren nedan. Sidan skickar därför en lista över
// vad den laddat, och det som saknas sparas här. Webbläsaren har redan filerna
// i sin vanliga cache, så det kostar sällan någon ny hämtning.
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.typ !== 'spara' || !Array.isArray(data.adresser)) return;
  event.waitUntil(
    (async () => {
      const cache = await caches.open(FILER);
      for (const adress of data.adresser.slice(0, 300)) {
        try {
          const url = new URL(adress, self.location.origin);
          if (url.origin !== self.location.origin || !arOforanderlig(url.pathname)) continue;
          if (await cache.match(url.href)) continue;
          const svar = await fetch(url.href);
          if (sparbar(svar)) await cache.put(url.href, svar);
        } catch {
          // En fil som inte gick att spara hämtas över nätet nästa gång.
        }
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Statistiken ska aldrig besvaras med något sparat.
  if (url.pathname.startsWith('/api/')) return;

  // Sidhämtning: nätet först, så att en ny version når fram direkt. Utan nät
  // visas den sparade sidan.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((svar) => {
          if (svar.ok && (svar.headers.get('content-type') || '').includes('text/html')) {
            const kopia = svar.clone();
            caches.open(SIDOR).then((c) => c.put(sidnyckel(url), kopia)).catch(() => {});
          }
          return svar;
        })
        .catch(async () => {
          const cache = await caches.open(SIDOR);
          const sparad = await cache.match(sidnyckel(url));
          if (sparad) return sparad;
          // En sida som aldrig besökts finns inte sparad. Skicka eleven till
          // startsidan i stället för webbläsarens felsida.
          const start = self.location.origin + '/';
          if (url.pathname !== '/' && (await cache.match(start))) return Response.redirect(start, 302);
          return Response.error();
        })
    );
    return;
  }

  if (arOforanderlig(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (traff) =>
          traff ||
          fetch(request).then((svar) => {
            if (sparbar(svar)) {
              const kopia = svar.clone();
              caches.open(FILER).then((c) => c.put(request, kopia)).catch(() => {});
            }
            return svar;
          })
      )
    );
    return;
  }

  // Bilder: visa den sparade direkt och hämta en färsk kopia i bakgrunden.
  if (arBild(url.pathname)) {
    event.respondWith(
      caches.open(BILDER).then(async (cache) => {
        const traff = await cache.match(request);
        const hamtning = fetch(request)
          .then((svar) => {
            if (sparbar(svar)) cache.put(request, svar.clone()).catch(() => {});
            return svar;
          })
          .catch(() => traff || Response.error());
        if (traff) {
          event.waitUntil(hamtning);
          return traff;
        }
        return hamtning;
      })
    );
  }
});
