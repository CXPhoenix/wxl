<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
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
  <div class="repeat-panel">
    <div class="repeat-top">
      <textarea
        data-request-input
        v-model="requestText"
        class="request-area"
        rows="10"
        spellcheck="false"
      />
      <div class="repeat-actions">
        <button data-send @click="send">Send</button>
        <button data-save-snapshot @click="saveSnapshot">Save</button>
      </div>
    </div>

    <pre data-response-output class="response-area">{{ responseText }}</pre>

    <ul v-if="snapshots.length" class="snapshots">
      <li
        v-for="snap in snapshots"
        :key="snap.name"
        data-snapshot-item
        @click="restoreSnapshot(snap.content)"
        class="snapshot-item"
      >
        {{ snap.name }}
      </li>
    </ul>
  </div>
</template>
