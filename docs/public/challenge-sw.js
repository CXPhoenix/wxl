/**
 * Challenge Service Worker
 * Intercepts https://challenge-<slug>.localhost/* and routes to the
 * appropriate runtime (Python ASGI bridge or PHP).
 */

const CHALLENGE_HOST_RE = /^challenge-[^.]+\.localhost$/

/** slug → { backend } */
const registry = new Map()

/** Runtime dispatch functions, registered by the page via postMessage */
let pythonDispatch = null
let phpDispatch = null

const production = self.location.hostname !== 'localhost'

// ─── Message handling ─────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const msg = event.data
  if (!msg?.type) return

  if (msg.type === 'REGISTER_CHALLENGE') {
    registry.set(msg.slug, { backend: msg.backend })
    event.source?.postMessage({ type: 'REGISTERED' })
  } else if (msg.type === 'UNREGISTER_CHALLENGE') {
    registry.delete(msg.slug)
  } else if (msg.type === 'SET_PYTHON_DISPATCH') {
    pythonDispatch = msg.dispatch
  } else if (msg.type === 'SET_PHP_DISPATCH') {
    phpDispatch = msg.dispatch
  }
})

// ─── Fetch interception ───────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (!CHALLENGE_HOST_RE.test(url.hostname)) return  // pass through

  event.respondWith(handleChallengeRequest(event.request, url))
})

async function handleChallengeRequest(request, url) {
  const slug = url.hostname.replace(/^challenge-/, '').replace(/\.localhost$/, '')
  const entry = registry.get(slug)

  if (!entry) {
    return jsonResponse({ error: 'challenge not registered' }, 503)
  }

  try {
    const backend = entry.backend
    if (backend === 'flask' || backend === 'fastapi') {
      if (!pythonDispatch) return jsonResponse({ error: 'python runtime not ready' }, 503)
      return await pythonDispatch(request)
    } else if (backend === 'php') {
      if (!phpDispatch) return jsonResponse({ error: 'php runtime not ready' }, 503)
      return await phpDispatch(request)
    } else {
      return jsonResponse({ error: `unknown backend: ${backend}` }, 501)
    }
  } catch (err) {
    if (production) {
      return jsonResponse({ error: 'Internal Server Error' }, 500)
    }
    return jsonResponse({ error: err.message, stack: err.stack }, 500)
  }
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
