/**
 * useWxlsh — command dispatch composable for the wxlsh terminal.
 *
 * Architecture (Option B):
 *   User input
 *     → Rust WASM parser  (tokenise + parse flags)
 *     → Command Dispatcher
 *         ├─ Rust-native commands  (help, clear, base64, hex)
 *         └─ Python-backed commands (curl, decode, encode, …) via Pyodide
 */

import { ref, type Ref } from 'vue'
import { useChallengePersistence } from './useChallengePersistence'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandResult {
  output: string
  /** When true the terminal should be cleared before this output. */
  clear?: boolean
  /** When true the output is an error message. */
  error?: boolean
}

export interface WxlshOptions {
  /** The challenge slug — used to build the challenge hostname for HTTP commands. */
  slug: string
  /** Dispatch function from ChallengeLayout — routes HTTP requests through the SW. */
  dispatch: (req: Request) => Promise<Response>
  /** Pyodide instance (may be null when runtime is not yet ready). */
  pyodide: Ref<PyodidePublicAPI | null>
}

/** Minimal subset of the Pyodide public API used here. */
export interface PyodidePublicAPI {
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>
  globals: { get(name: string): unknown; set(name: string, value: unknown): void }
}

// ─── Lazy WASM loader ─────────────────────────────────────────────────────────

let wasmReady: Promise<WasmParser> | null = null

interface WasmParser {
  wasm_parse_command(input: string): ParsedCommand | null
  wasm_execute_native(command: string, args: unknown, flags: unknown): NativeResult | null
}

interface ParsedCommand {
  command: string
  args: string[]
  flags: Record<string, string>
}

interface NativeResult {
  output: string
  clear: boolean
}

async function loadWasm(): Promise<WasmParser> {
  if (!wasmReady) {
    wasmReady = import('../../../.vitepress/wasm/wxlsh-parser/wxlsh_parser.js').then(async (mod) => {
      await mod.default()  // initialise WASM binary
      return mod as unknown as WasmParser
    }).catch(() => {
      // Fallback: WASM not built yet — return a pure-TS stub
      return {
        wasm_parse_command: (input: string) => tsParseCommand(input),
        wasm_execute_native: () => null,
      } as WasmParser
    })
  }
  return wasmReady
}

// ─── Pure-TS parser fallback (mirrors Rust logic, used when WASM unavailable) ──

function tsParseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim()
  if (!trimmed) return { command: '', args: [], flags: {} }
  const tokens = tsTokenize(trimmed)
  if (tokens.length === 0) return { command: '', args: [], flags: {} }
  const command = tokens[0].value
  const args: string[] = []
  const flags: Record<string, string> = {}
  let i = 1
  while (i < tokens.length) {
    const tok = tokens[i]
    if (tok.quoted) { args.push(tok.value); i++; continue }
    if (tok.value.startsWith('--')) {
      const long = tok.value.slice(2)
      const eq = long.indexOf('=')
      if (eq >= 0) flags[long.slice(0, eq)] = long.slice(eq + 1)
      else flags[long] = ''
    } else if (tok.value.startsWith('-') && tok.value.length > 1) {
      const key = tok.value.slice(1)
      const next = tokens[i + 1]
      if (next && !next.value.startsWith('-') && !next.quoted) {
        flags[key] = next.value; i++
      } else if (next && !next.value.startsWith('-') && next.quoted) {
        flags[key] = next.value; i++
      } else {
        flags[key] = ''
      }
    } else {
      args.push(tok.value)
    }
    i++
  }
  return { command, args, flags }
}

function tsTokenize(input: string): Array<{ value: string; quoted: boolean }> {
  const tokens: Array<{ value: string; quoted: boolean }> = []
  let current = ''
  let inQuote: string | null = null
  let isQuoted = false
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuote === null && (ch === '"' || ch === "'")) {
      inQuote = ch; isQuoted = true
    } else if (inQuote !== null && ch === inQuote) {
      tokens.push({ value: current, quoted: true }); current = ''; inQuote = null; isQuoted = false
    } else if (inQuote === '"' && ch === '\\') {
      const next = input[++i]
      current += next === 'n' ? '\n' : next === 't' ? '\t' : next ?? ''
    } else if (inQuote === null && /\s/.test(ch)) {
      if (current) { tokens.push({ value: current, quoted: isQuoted }); current = ''; isQuoted = false }
    } else {
      current += ch
    }
  }
  if (current) tokens.push({ value: current, quoted: isQuoted })
  return tokens
}

// ─── Python-backed command module ─────────────────────────────────────────────

/** Python source that defines the Python-backed wxlsh commands. */
const WXLSH_PYTHON_COMMANDS = `
import json, base64 as _b64, urllib.parse

class _WxlshDispatch:
    """Thin wrapper that routes HTTP via the JS dispatch bridge."""
    def __init__(self, bridge):
        self._bridge = bridge

    def request(self, method, url, headers=None, body=None):
        h = list((headers or {}).items())
        result = self._bridge.call(method, url, h, body or '')
        return _WxlshResponse(result)

class _WxlshResponse:
    def __init__(self, raw):
        self.status_code = int(raw['status'])
        self._headers = dict(raw['headers'])
        self.text = raw['body']
        self.content = raw['body'].encode('utf-8', errors='replace')

    @property
    def headers(self):
        return self._headers

    def json(self):
        return json.loads(self.text)

    def __repr__(self):
        return f'<WxlshResponse [{self.status_code}]>'

_wxlsh_http = _WxlshDispatch(_wxlsh_bridge)

def _cmd_curl(args, flags):
    method = flags.get('X', flags.get('method', 'GET')).upper()
    if 'd' in flags or 'data' in flags:
        method = 'POST'
    body = flags.get('d', flags.get('data', ''))

    # Collect headers from -H flags
    raw_headers = {}
    h_val = flags.get('H', flags.get('header', ''))
    if h_val:
        parts = h_val.split(':', 1)
        if len(parts) == 2:
            raw_headers[parts[0].strip()] = parts[1].strip()

    if not args:
        return 'Usage: curl [-X METHOD] [-d body] [-H header:value] <url>'

    url = args[-1]
    if not url.startswith('http'):
        url = 'https://challenge-' + _wxlsh_slug + '.localhost/' + url.lstrip('/')

    r = _wxlsh_http.request(method, url, raw_headers, body)

    lines = [f'{method} {url}', f'← {r.status_code}']
    ct = r.headers.get('content-type', r.headers.get('Content-Type', ''))
    if 'json' in ct:
        try:
            lines.append(json.dumps(r.json(), indent=2, ensure_ascii=False))
        except Exception:
            lines.append(r.text)
    else:
        lines.append(r.text)
    return '\\n'.join(lines)

def _cmd_decode(args, flags):
    if not args:
        return 'Usage: decode <base64|url|hex> <value>'
    mode = args[0] if len(args) > 1 else 'base64'
    value = ' '.join(args[1:] if len(args) > 1 else args)
    if mode == 'base64':
        try:
            return _b64.b64decode(value + '==').decode('utf-8', errors='replace')
        except Exception as e:
            return f'decode error: {e}'
    elif mode == 'url':
        return urllib.parse.unquote(value)
    elif mode == 'hex':
        try:
            return bytes.fromhex(value.replace(' ', '')).decode('utf-8', errors='replace')
        except Exception as e:
            return f'decode error: {e}'
    return f'Unknown encoding: {mode}'

def _cmd_encode(args, flags):
    if not args:
        return 'Usage: encode <base64|url|hex> <value>'
    mode = args[0] if len(args) > 1 else 'base64'
    value = ' '.join(args[1:] if len(args) > 1 else args)
    if mode == 'base64':
        return _b64.b64encode(value.encode()).decode()
    elif mode == 'url':
        return urllib.parse.quote(value)
    elif mode == 'hex':
        return value.encode('utf-8').hex()
    return f'Unknown encoding: {mode}'

_wxlsh_commands_py = {
    'curl': _cmd_curl,
    'decode': _cmd_decode,
    'encode': _cmd_encode,
}
`

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWxlsh(options: WxlshOptions) {
  const { slug, dispatch, pyodide } = options
  const { appendHistory, loadHistory } = useChallengePersistence()

  // In-memory history ring for arrow-key navigation
  const historyBuffer = ref<string[]>([])
  const historyIndex = ref(-1)   // -1 = not navigating
  let pythonCommandsLoaded = false

  // ─── Initialise ─────────────────────────────────────────────────────────

  /** Restore history from IDB on first use. */
  async function init() {
    historyBuffer.value = await loadHistory(200)
    historyIndex.value = -1
    await loadWasm()
  }

  // ─── Python bridge setup ────────────────────────────────────────────────

  async function ensurePythonCommands(): Promise<boolean> {
    const py = pyodide.value
    if (!py || pythonCommandsLoaded) return !!py
    try {
      // Inject bridge object so Python can call dispatch
      const bridge = {
        call: async (method: string, url: string, headers: [string, string][], body: string) => {
          const req = new Request(url, {
            method,
            headers: Object.fromEntries(headers),
            body: body || undefined,
          })
          const res = await dispatch(req)
          const resHeaders = [...res.headers.entries()]
          const text = await res.text()
          return { status: res.status, headers: resHeaders, body: text }
        },
      }
      py.globals.set('_wxlsh_bridge', bridge)
      py.globals.set('_wxlsh_slug', slug)
      await py.runPythonAsync(WXLSH_PYTHON_COMMANDS)
      pythonCommandsLoaded = true
    } catch (e) {
      console.warn('[useWxlsh] Python command setup failed:', e)
    }
    return pythonCommandsLoaded
  }

  // ─── Command execution ───────────────────────────────────────────────────

  async function execute(input: string): Promise<CommandResult> {
    const trimmed = input.trim()
    if (!trimmed) return { output: '' }

    // 1. Persist to history
    await appendHistory(trimmed)
    historyBuffer.value = [...historyBuffer.value, trimmed]
    historyIndex.value = -1

    // 2. Parse
    const wasm = await loadWasm()
    const parsed = wasm.wasm_parse_command(trimmed)
    if (!parsed || !parsed.command) return { output: '' }

    const { command, args, flags } = parsed

    // 3. Try Rust-native first
    try {
      const native = wasm.wasm_execute_native(command, args, flags)
      if (native !== null) {
        return { output: native.output, clear: native.clear }
      }
    } catch {
      // WASM not available — fall through
    }

    // 4. Try Python-backed
    const pyReady = await ensurePythonCommands()
    if (pyReady && pyodide.value) {
      const py = pyodide.value
      try {
        const cmds = py.globals.get('_wxlsh_commands_py') as Record<string, unknown>
        if (cmds && command in cmds) {
          const result = await py.runPythonAsync(
            `str(_wxlsh_commands_py[${JSON.stringify(command)}](${JSON.stringify(args)}, ${JSON.stringify(flags)}))`
          )
          return { output: String(result) }
        }
      } catch (e) {
        return { output: `Error: ${e instanceof Error ? e.message : String(e)}`, error: true }
      }
    }

    // 5. Unknown command
    return {
      output: `wxlsh: command not found: ${command}\nType 'help' for available commands.`,
      error: true,
    }
  }

  // ─── History navigation ──────────────────────────────────────────────────

  /** Returns the previous history entry (up arrow). */
  function historyPrev(currentInput: string): string {
    const buf = historyBuffer.value
    if (buf.length === 0) return currentInput
    if (historyIndex.value === -1) {
      historyIndex.value = buf.length - 1
    } else if (historyIndex.value > 0) {
      historyIndex.value--
    }
    return buf[historyIndex.value]
  }

  /** Returns the next history entry (down arrow), or '' if past the end. */
  function historyNext(): string {
    const buf = historyBuffer.value
    if (historyIndex.value === -1) return ''
    if (historyIndex.value < buf.length - 1) {
      historyIndex.value++
      return buf[historyIndex.value]
    }
    historyIndex.value = -1
    return ''
  }

  return { init, execute, historyPrev, historyNext, historyBuffer }
}
