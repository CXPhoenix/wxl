<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
const methods: Method[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const url = ref(`https://challenge-${props.slug}.localhost/`)
const method = ref<Method>('GET')
const body = ref('')

type ResponseState =
  | { type: 'idle' }
  | { type: 'html'; content: string }
  | { type: 'text'; content: string }

const responseState = ref<ResponseState>({ type: 'idle' })

async function send() {
  const req = new Request(url.value, {
    method: method.value,
    body: method.value !== 'GET' && body.value ? body.value : undefined,
  })
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
</script>

<template>
  <div class="flex flex-col h-full gap-2">
    <div class="flex gap-2 flex-shrink-0">
      <select
        v-model="method"
        class="px-2 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.85em] cursor-pointer"
      >
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input
        v-model="url"
        type="text"
        placeholder="URL"
        class="flex-1 px-2 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.85em] font-mono outline-none focus:border-[var(--ch-accent)]"
      />
      <button
        data-send
        class="px-3 py-1 rounded bg-[var(--ch-accent)] color-white text-[0.85em] border-none"
        :class="props.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'"
        :disabled="props.disabled"
        @click="send"
      >{{ props.disabled ? 'Loading…' : 'Send' }}</button>
    </div>

    <textarea
      v-if="method !== 'GET'"
      v-model="body"
      placeholder="Request body"
      class="w-full px-2 py-1 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.85em] font-mono resize-y outline-none focus:border-[var(--ch-accent)]"
      rows="4"
    />

    <iframe
      v-if="responseState.type === 'html'"
      sandbox="allow-scripts allow-forms"
      :srcdoc="responseState.content"
      class="flex-1 w-full rounded border border-[var(--ch-border)] bg-white"
    />
    <pre
      v-else-if="responseState.type === 'text'"
      data-response-text
      class="flex-1 m-0 p-3 rounded border border-[var(--ch-border)] bg-[var(--ch-bg-soft)] color-[var(--ch-text-1)] text-[0.8em] font-mono overflow-auto whitespace-pre-wrap"
    >{{ responseState.content }}</pre>
  </div>
</template>
