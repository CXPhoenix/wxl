import { ref } from 'vue'

export interface TrafficEntry {
  id: number
  timestamp: number
  method: string
  url: string
  requestHeaders: [string, string][]
  requestBody: string | null
  status: number
  responseHeaders: [string, string][]
  responseBody: string
  duration: number
}

export function useTrafficLog() {
  const trafficLog = ref<TrafficEntry[]>([])
  let nextId = 1

  function wrap(
    dispatch: (req: Request) => Promise<Response>,
  ): (req: Request) => Promise<Response> {
    return async (request: Request): Promise<Response> => {
      const start = performance.now()
      const method = request.method
      const url = request.url
      const requestHeaders = [...request.headers.entries()] as [string, string][]

      // Clone before dispatch so we can read the body without consuming the original
      const reqClone = request.clone()

      const response = await dispatch(request)
      const duration = Math.round(performance.now() - start)

      // Read request body from clone (non-blocking — dispatch is already done)
      let requestBody: string | null = null
      if (method !== 'GET' && method !== 'HEAD') {
        try {
          const text = await reqClone.text()
          requestBody = text || null
        } catch {
          requestBody = null
        }
      }

      // Clone response to read body without consuming the original
      const resClone = response.clone()
      let responseBody = ''
      try {
        responseBody = await resClone.text()
      } catch {
        responseBody = ''
      }

      const responseHeaders = [...response.headers.entries()] as [string, string][]

      trafficLog.value.push({
        id: nextId++,
        timestamp: Date.now(),
        method,
        url,
        requestHeaders,
        requestBody,
        status: response.status,
        responseHeaders,
        responseBody,
        duration,
      })

      return response
    }
  }

  function clear() {
    trafficLog.value = []
    nextId = 1
  }

  return { trafficLog, wrap, clear }
}
