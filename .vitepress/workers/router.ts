export type BackendType = 'flask' | 'fastapi' | 'php'

export type BackendDispatcher = (request: Request) => Promise<Response>

interface RouterDispatchers {
  python?: BackendDispatcher
  php?: BackendDispatcher
}

interface RouterOptions {
  production?: boolean
}

interface ChallengeEntry {
  backend: BackendType | string
}

const CHALLENGE_HOST_RE = /^challenge-[^.]+\.localhost$/

export function createRouter(dispatchers: RouterDispatchers = {}, opts: RouterOptions = {}) {
  const registry = new Map<string, ChallengeEntry>()

  function shouldIntercept(url: URL): boolean {
    return CHALLENGE_HOST_RE.test(url.hostname)
  }

  function slugFromHost(hostname: string): string {
    // challenge-<slug>.localhost → <slug>
    return hostname.replace(/^challenge-/, '').replace(/\.localhost$/, '')
  }

  function handleMessage(msg: { type: string; slug: string; backend?: string }) {
    if (msg.type === 'REGISTER_CHALLENGE') {
      registry.set(msg.slug, { backend: msg.backend ?? 'flask' })
    } else if (msg.type === 'UNREGISTER_CHALLENGE') {
      registry.delete(msg.slug)
    }
  }

  async function dispatch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const slug = slugFromHost(url.hostname)
    const entry = registry.get(slug)

    if (!entry) {
      return new Response(JSON.stringify({ error: 'challenge not registered' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const backend = entry.backend
      if (backend === 'flask' || backend === 'fastapi') {
        if (!dispatchers.python) {
          return new Response(JSON.stringify({ error: 'python runtime not available' }), {
            status: 503, headers: { 'Content-Type': 'application/json' },
          })
        }
        return await dispatchers.python(request)
      } else if (backend === 'php') {
        if (!dispatchers.php) {
          return new Response(JSON.stringify({ error: 'php runtime not available' }), {
            status: 503, headers: { 'Content-Type': 'application/json' },
          })
        }
        return await dispatchers.php(request)
      } else {
        return new Response(JSON.stringify({ error: `unknown backend: ${backend}` }), {
          status: 501, headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch (err: unknown) {
      if (opts.production) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
          status: 500, headers: { 'Content-Type': 'application/json' },
        })
      }
      const message = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : undefined
      return new Response(JSON.stringify({ error: message, stack }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return { shouldIntercept, handleMessage, dispatch }
}
