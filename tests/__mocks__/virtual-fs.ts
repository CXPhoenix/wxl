// Test stub for /wasm/virtual-fs/virtual_fs.js
// Provides no-op implementations of wasm_fs_init and wasm_fs_read
export function wasm_fs_init(_paths: string[], _blobs: string[]): void {}
export function wasm_fs_read(_key: Uint8Array, _path: string): Uint8Array {
  return new Uint8Array()
}
export default async function init(): Promise<void> {}
