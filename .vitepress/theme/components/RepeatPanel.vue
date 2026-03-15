<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()

const requestText = ref(`GET / HTTP/1.1\r\nHost: challenge-${props.slug}.localhost\r\n\r\n`)
const responseText = ref('')
const snapshots = ref<{ name: string; content: string }[]>([])
let snapshotCounter = 1

async function send() {
  const req = parseRawRequest(requestText.value)
  if (!req) { responseText.value = 'Error: invalid request format'; return }

  try {
    const res = await props.dispatch(req)
    const body = await res.text()
    const headerLines: string[] = []
    res.headers.forEach((v, k) => headerLines.push(`${k}: ${v}`))
    responseText.value = [
      `HTTP/1.1 ${res.status} ${res.statusText || ''}`,
      ...headerLines,
      '',
      body,
    ].join('\n')
  } catch (err) {
    responseText.value = `Error: ${(err as Error).message}`
  }
}

function saveSnapshot() {
  snapshots.value.push({ name: `Snapshot ${snapshotCounter++}`, content: requestText.value })
}

function restoreSnapshot(content: string) {
  requestText.value = content
}

function parseRawRequest(raw: string): Request | null {
  const crlf = raw.includes('\r\n') ? '\r\n' : '\n'
  const [headerSection, ...bodyParts] = raw.split(crlf + crlf)
  const lines = headerSection.split(crlf)
  const requestLine = lines[0]
  if (!requestLine) return null

  const parts = requestLine.split(' ')
  const method = parts[0]
  const path = parts[1] ?? '/'

  const headers = new Headers()
  let host = `challenge-${props.slug}.localhost`
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const name = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    headers.set(name, value)
    if (name.toLowerCase() === 'host') host = value
  }

  const bodyStr = bodyParts.join(crlf + crlf)
  const url = `https://${host}${path}`

  return new Request(url, {
    method,
    headers,
    body: bodyStr || undefined,
  })
}
</script>

<template>
  <div class="flex flex-col h-full gap-2">
    <div class="flex gap-2 flex-1 overflow-hidden">
      <textarea
        data-request-input
        v-model="requestText"
        class="flex-1 p-2 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] font-mono text-[0.82em] resize-none outline-none focus:border-[var(--ch-accent)]"
        rows="10"
        spellcheck="false"
      />
      <div class="flex flex-col gap-2 flex-shrink-0">
        <button
          data-send
          class="px-3 py-1 rounded bg-[var(--ch-accent)] color-white text-[0.85em] border-none"
          :class="props.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'"
          :disabled="props.disabled"
          @click="send"
        >Send</button>
        <button
          data-save-snapshot
          class="px-3 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-2)] text-[0.85em] cursor-pointer hover:border-[var(--ch-accent)]"
          @click="saveSnapshot"
        >Save</button>
      </div>
    </div>

    <pre
      data-response-output
      class="flex-1 m-0 p-3 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] font-mono text-[0.8em] overflow-auto whitespace-pre-wrap"
    >{{ responseText }}</pre>

    <ul v-if="snapshots.length" class="m-0 p-0 list-none flex gap-2 flex-wrap">
      <li
        v-for="snap in snapshots"
        :key="snap.name"
        data-snapshot-item
        class="px-2 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-2)] text-[0.8em] cursor-pointer hover:border-[var(--ch-accent)] hover:color-[var(--ch-accent)]"
        @click="restoreSnapshot(snap.content)"
      >
        {{ snap.name }}
      </li>
    </ul>
  </div>
</template>
