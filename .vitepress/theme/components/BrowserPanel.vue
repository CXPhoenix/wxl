<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onUnmounted } from 'vue'
import BrowserChrome from './BrowserChrome.vue'

const props = defineProps<{
  slug: string
  dispatch: (request: Request) => Promise<Response>
  disabled?: boolean
}>()

const url = ref(`https://challenge-${props.slug}.localhost/`)
const iframeRef = useTemplateRef<HTMLIFrameElement>('iframeEl')

// ─── Request context metadata (consumed by useTrafficLog for display headers) ─
// Forbidden request headers (User-Agent, Referer, Sec-*, etc.) cannot be set
// on Request objects via the Fetch API. Instead, we pass context via custom
// X-Wxlsh-* headers; useTrafficLog.wrap() reads them, strips them, and uses
// them to build the full simulated browser header set for the traffic log.

function withContext(init: RequestInit, context: string, referer?: string): RequestInit {
  const headers = new Headers(init.headers)
  headers.set('X-Wxlsh-Context', context)
  if (referer) headers.set('X-Wxlsh-Referer', referer)
  return { ...init, headers }
}

type ResponseState =
  | { type: 'idle' }
  | { type: 'html'; content: string }
  | { type: 'text'; content: string }

const responseState = ref<ResponseState>({ type: 'idle' })

/**
 * Inject a postMessage-based interceptor script into an HTML string.
 * The script captures link clicks and form submissions inside the iframe
 * and relays them to the parent via postMessage, so that allow-same-origin
 * is not needed in the sandbox (which would defeat the sandbox).
 */
function injectInterceptor(html: string): string {
  const script = `<script>(function(){
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a');
    if(!a)return;
    var href=a.getAttribute('href');
    if(!href||href.charAt(0)==='#')return;
    e.preventDefault();
    parent.postMessage({type:'WXLSH_LINK_CLICK',href:href},'*');
  });
  document.addEventListener('submit',function(e){
    e.preventDefault();
    var form=e.target;
    var fields=[];
    var els=form.elements;
    for(var i=0;i<els.length;i++){if(els[i].name)fields.push([els[i].name,els[i].value]);}
    parent.postMessage({type:'WXLSH_FORM_SUBMIT',action:form.getAttribute('action')||'',method:(form.getAttribute('method')||'GET').toUpperCase(),enctype:form.getAttribute('enctype')||'application/x-www-form-urlencoded',fields:fields},'*');
  });
})();<` + `/script>`

  const bodyClose = html.lastIndexOf('</body>')
  if (bodyClose !== -1) return html.slice(0, bodyClose) + script + html.slice(bodyClose)
  return html + script
}

/** Shared response handler — updates responseState and url bar. */
async function handleResponse(res: Response, resolvedUrl: string) {
  url.value = resolvedUrl
  const ct = res.headers.get('content-type') ?? ''
  const text = await res.text()
  if (ct.includes('text/html')) {
    responseState.value = { type: 'html', content: injectInterceptor(text) }
  } else {
    let formatted = text
    if (ct.includes('application/json')) {
      try { formatted = JSON.stringify(JSON.parse(text), null, 2) } catch { /* keep raw */ }
    }
    responseState.value = { type: 'text', content: formatted }
  }
}

async function navigate() {
  if (props.disabled) return
  const req = new Request(url.value, withContext({ method: 'GET' }, 'navigation'))
  const res = await props.dispatch(req)
  await handleResponse(res, url.value)
}

// ─── postMessage handler: receives link/form events from sandboxed iframe ─────
// The iframe runs with sandbox="allow-scripts allow-forms" (no allow-same-origin),
// so its JS cannot access the parent DOM. Instead, an injected script inside
// the srcdoc posts structured messages that are handled here.

function handleIframeMessage(event: MessageEvent) {
  if (event.source !== iframeRef.value?.contentWindow) return
  const data = event.data
  if (!data?.type) return

  const base = `https://challenge-${props.slug}.localhost/`
  const referer = url.value

  if (data.type === 'WXLSH_LINK_CLICK') {
    const href = data.href as string
    if (!href || href.startsWith('#')) return
    const resolved = new URL(href, base).href
    url.value = resolved
    const req = new Request(resolved, withContext({ method: 'GET' }, 'link', referer))
    props.dispatch(req).then(res => handleResponse(res, resolved))
  } else if (data.type === 'WXLSH_FORM_SUBMIT') {
    const { action, method, enctype, fields } = data as {
      action: string
      method: string
      enctype: string
      fields: [string, string][]
    }
    const resolvedUrl = action ? new URL(action, base).href : url.value

    if (method === 'GET') {
      const params = new URLSearchParams(fields)
      const sep = resolvedUrl.includes('?') ? '&' : '?'
      const target = params.toString() ? `${resolvedUrl}${sep}${params}` : resolvedUrl
      const req = new Request(target, withContext({ method: 'GET' }, 'form-get', referer))
      props.dispatch(req).then(res => handleResponse(res, target))
    } else if (enctype === 'multipart/form-data') {
      const body = new FormData()
      for (const [k, v] of fields) body.append(k, v)
      const req = new Request(resolvedUrl, withContext({ method, body }, 'form-post', referer))
      props.dispatch(req).then(res => handleResponse(res, resolvedUrl))
    } else {
      const bodyStr = new URLSearchParams(fields).toString()
      const req = new Request(resolvedUrl, withContext({
        method,
        body: bodyStr,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, 'form-post', referer))
      props.dispatch(req).then(res => handleResponse(res, resolvedUrl))
    }
  }
}

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Browser chrome (URL bar + nav buttons) -->
    <BrowserChrome
      v-model="url"
      :disabled="props.disabled"
      @navigate="navigate"
    />

    <!-- Response viewport -->
    <iframe
      v-if="responseState.type === 'html'"
      ref="iframeEl"
      sandbox="allow-scripts allow-forms"
      :srcdoc="responseState.content"
      class="flex-1 w-full rounded border border-[var(--ch-border)] bg-white"
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
