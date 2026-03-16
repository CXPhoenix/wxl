<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()

const url = ref(`https://challenge-${props.slug}.localhost/`)
const iframeRef = useTemplateRef<HTMLIFrameElement>('iframeEl')

type ResponseState =
  | { type: 'idle' }
  | { type: 'html'; content: string }
  | { type: 'text'; content: string }

const responseState = ref<ResponseState>({ type: 'idle' })

async function navigate() {
  if (props.disabled) return
  const req = new Request(url.value, { method: 'GET' })
  const res = await props.dispatch(req)
  const ct = res.headers.get('content-type') ?? ''
  const text = await res.text()
  if (ct.includes('text/html')) {
    responseState.value = { type: 'html', content: text }
  } else {
    let formatted = text
    if (ct.includes('application/json')) {
      try { formatted = JSON.stringify(JSON.parse(text), null, 2) } catch { /* keep raw */ }
    }
    responseState.value = { type: 'text', content: formatted }
  }
}

// Intercept <a> clicks inside the iframe and handle them via dispatch().
// Called on iframe load to (re-)attach the listener after srcdoc updates.
function attachIframeLinkInterceptor() {
  const iframe = iframeRef.value
  if (!iframe) return
  try {
    const doc = iframe.contentDocument
    if (!doc) return
    doc.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#')) return
      e.preventDefault()
      // Resolve relative URLs against the challenge base
      const base = `https://challenge-${props.slug}.localhost/`
      url.value = new URL(href, base).href
      navigate()
    })
  } catch {
    // Cross-origin frames: silently ignore (shouldn't happen with srcdoc + allow-same-origin)
  }
}
</script>

<template>
  <div class="flex flex-col h-full gap-2">
    <!-- Address bar -->
    <div class="flex gap-2 flex-shrink-0">
      <input
        data-url-input
        v-model="url"
        type="text"
        placeholder="https://challenge-…"
        @keydown.enter="navigate"
        class="flex-1 px-2 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.85em] font-mono outline-none focus:border-[var(--ch-accent)]"
      />
      <button
        data-go
        class="px-3 py-1 rounded bg-[var(--ch-accent)] color-white text-[0.85em] border-none"
        :class="props.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'"
        :disabled="props.disabled"
        @click="navigate"
      >{{ props.disabled ? 'Loading…' : 'Go' }}</button>
    </div>

    <!-- Response viewport -->
    <iframe
      v-if="responseState.type === 'html'"
      ref="iframeEl"
      sandbox="allow-scripts allow-forms allow-same-origin"
      :srcdoc="responseState.content"
      class="flex-1 w-full rounded border border-[var(--ch-border)] bg-white"
      @load="attachIframeLinkInterceptor"
    />
    <pre
      v-else-if="responseState.type === 'text'"
      data-response-text
      class="flex-1 m-0 p-3 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.8em] font-mono overflow-auto whitespace-pre-wrap"
    >{{ responseState.content }}</pre>
    <div
      v-else
      class="flex-1 flex items-center justify-center color-[var(--ch-text-2)] text-[0.85em]"
    >
      Enter a URL and press Go
    </div>
  </div>
</template>
