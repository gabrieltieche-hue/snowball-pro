/**
 * Service worker Snowball Pro v5
 *
 * Sécurité & fraîcheur :
 * - Le nom de cache est versionné (snowball-pro-v5) ; les caches obsolètes
 *   (préfixe snowball-pro-) sont purgés à l'activation.
 * - Navigation en réseau d'abord (network-first) : un déploiement ne laisse
 *   JAMAIS une version obsolète en cache — le réseau prime, le cache n'est
 *   qu'un secours hors-ligne.
 * - Les autres ressources même-origine sont en stale-while-revalidate.
 * - skipWaiting + clients.claim : la nouvelle version prend le contrôle
 *   immédiatement (pas de « version fantôme »).
 */
// ⚠️ À faire correspondre à chaque release (cf. version dans package.json) :
// sans bump, une ancienne version servie en cache peut survivre aux déploiements.
const CACHE_VERSION = "snowball-pro-v6.11.1"
const PRECACHE_URLS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      // Ne toucher QUE nos propres caches (snowball-pro-*) : sur une origine
      // partagée, ne jamais supprimer les caches d'autres applications.
      .then(keys =>
        Promise.all(
          keys.filter(key => key.startsWith("snowball-pro-") && key !== CACHE_VERSION).map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", event => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Navigation : réseau d'abord, cache en secours (hors-ligne)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Ne jamais mettre en cache une réponse en erreur / redirection
          if (response.ok) {
            const copy = response.clone()
            caches
              .open(CACHE_VERSION)
              .then(cache => cache.put("/", copy))
              .catch(() => {
                /* quota plein ou réponse non cacheable : on garde la réponse réseau */
              })
          }
          return response
        })
        .catch(() => caches.match("/")),
    )
    return
  }

  // Autres ressources même-origine : stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches
              .open(CACHE_VERSION)
              .then(cache => cache.put(request, copy))
              .catch(() => {
                /* même tolérance */
              })
          }
          return response
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
