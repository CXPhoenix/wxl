<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
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
  <div class="browser-panel">
    <div class="toolbar">
      <select v-model="method">
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input v-model="url" type="text" placeholder="URL" class="url-input" />
      <button data-send @click="send">Send</button>
    </div>

    <textarea v-if="method !== 'GET'" v-model="body" placeholder="Request body" />

    <iframe
      v-if="responseState.type === 'html'"
      sandbox="allow-scripts allow-forms"
      :srcdoc="responseState.content"
      class="response-iframe"
    />
    <pre
      v-else-if="responseState.type === 'text'"
      data-response-text
      class="response-text"
    >{{ responseState.content }}</pre>
  </div>
</template>
