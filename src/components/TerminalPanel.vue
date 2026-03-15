<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
}>()

const cmd = ref('')
const lines = ref<string[]>([])

const USAGE = 'Usage: curl <url> [-X method] [-H "name: value"] [-d body]\n       http [METHOD] <url>'

async function execute() {
  const raw = cmd.value.trim()
  if (!raw) return
  lines.value.push(`$ ${raw}`)
  cmd.value = ''

  const req = parseCli(raw)
  if (!req) {
    lines.value.push(USAGE)
    return
  }

  try {
    const res = await props.dispatch(req)
    lines.value.push(`HTTP/${res.status} ${res.statusText || statusText(res.status)}`)
    res.headers.forEach((v, k) => lines.value.push(`${k}: ${v}`))
    lines.value.push('')
    lines.value.push(await res.text())
  } catch (err) {
    lines.value.push(`Error: ${(err as Error).message}`)
  }
}

function parseCli(raw: string): Request | null {
  const tokens = tokenize(raw)
  if (!tokens.length) return null

  const cmd = tokens[0].toLowerCase()
  if (cmd === 'curl') return parseCurl(tokens.slice(1))
  if (cmd === 'http') return parseHttp(tokens.slice(1))
  return null
}

function parseCurl(args: string[]): Request | null {
  let url = ''
  let method = 'GET'
  const headers: Record<string, string> = {}
  let body: string | undefined

  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '-X' && args[i + 1]) { method = args[++i].toUpperCase() }
    else if ((a === '-H' || a === '--header') && args[i + 1]) { const h = args[++i]; const idx = h.indexOf(':'); if (idx !== -1) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim() }
    else if ((a === '-d' || a === '--data') && args[i + 1]) { body = args[++i]; if (method === 'GET') method = 'POST' }
    else if (!a.startsWith('-')) { url = a }
  }
  if (!url) return null
  return new Request(url, { method, headers, body })
}

function parseHttp(args: string[]): Request | null {
  if (!args.length) return null
  let method: string
  let url: string
  const firstUpper = args[0] === args[0].toUpperCase() && /^[A-Z]+$/.test(args[0])
  if (firstUpper) { method = args[0]; url = args[1] ?? ''; } else { method = 'GET'; url = args[0] }
  if (!url) return null
  return new Request(url, { method })
}

function tokenize(s: string): string[] {
  const tokens: string[] = []
  let cur = ''
  let inQ = ''
  for (const ch of s) {
    if (inQ) { if (ch === inQ) { inQ = ''; tokens.push(cur); cur = '' } else cur += ch }
    else if (ch === '"' || ch === "'") { inQ = ch }
    else if (ch === ' ' || ch === '\t') { if (cur) { tokens.push(cur); cur = '' } }
    else cur += ch
  }
  if (cur) tokens.push(cur)
  return tokens
}

function statusText(s: number): string {
  return { 200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' }[s] ?? ''
}
</script>

<template>
  <div class="terminal-panel">
    <div data-output class="terminal-output">
      <div v-for="(line, i) in lines" :key="i" class="terminal-line">{{ line }}</div>
    </div>
    <div class="terminal-input-row">
      <span class="prompt">$</span>
      <input
        data-cmd-input
        v-model="cmd"
        type="text"
        @keydown.enter="execute"
        placeholder="curl https://challenge-…"
        spellcheck="false"
        autocomplete="off"
      />
    </div>
  </div>
</template>
