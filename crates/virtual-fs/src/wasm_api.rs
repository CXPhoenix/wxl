use wasm_bindgen::prelude::*;
use crate::crypto::{decrypt, encrypt};
use crate::idb::FsStore;
use std::cell::RefCell;

thread_local! {
    static STORE: RefCell<FsStore> = RefCell::new(FsStore::new());
}

fn key32(key_bytes: &[u8]) -> Result<[u8; 32], JsValue> {
    key_bytes.try_into().map_err(|_| JsValue::from_str("key must be 32 bytes"))
}

/// Encrypt plaintext and write to the in-memory store.
/// Returns base64(nonce || ciphertext) for persistence in IndexedDB via JS.
#[wasm_bindgen]
pub fn wasm_fs_write(key_bytes: &[u8], path: &str, plaintext: &[u8]) -> Result<String, JsValue> {
    let key = key32(key_bytes)?;
    let blob = encrypt(&key, plaintext).map_err(|e| JsValue::from_str(&e))?;
    STORE.with(|s| s.borrow_mut().write(path, blob.data.clone()));
    Ok(base64_encode(&blob.data))
}

/// Decrypt a stored blob and return the plaintext bytes.
#[wasm_bindgen]
pub fn wasm_fs_read(key_bytes: &[u8], path: &str) -> Result<Vec<u8>, JsValue> {
    let key = key32(key_bytes)?;
    STORE.with(|s| {
        let store = s.borrow();
        let raw = store.read(path).ok_or_else(|| JsValue::from_str("path not found"))?;
        decrypt(&key, raw).map_err(|e| JsValue::from_str(&e))
    })
}

/// Initialise the store from a pre-encrypted blob map. Skips if already populated.
/// `paths` and `encrypted_blobs` are parallel arrays.
#[wasm_bindgen]
pub fn wasm_fs_init(paths: Vec<String>, encrypted_blobs: Vec<String>) -> Result<(), JsValue> {
    STORE.with(|s| {
        let mut store = s.borrow_mut();
        if !store.is_empty() {
            return Ok(());
        }
        for (path, b64) in paths.iter().zip(encrypted_blobs.iter()) {
            let bytes = base64_decode(b64).map_err(|e| JsValue::from_str(&e))?;
            store.write(path, bytes);
        }
        Ok(())
    })
}

/// Reset the store: delete all entries, then re-populate from the provided blobs.
#[wasm_bindgen]
pub fn wasm_fs_reset(paths: Vec<String>, encrypted_blobs: Vec<String>) -> Result<(), JsValue> {
    STORE.with(|s| {
        let mut store = s.borrow_mut();
        store.delete_all();
        for (path, b64) in paths.iter().zip(encrypted_blobs.iter()) {
            let bytes = base64_decode(b64).map_err(|e| JsValue::from_str(&e))?;
            store.write(path, bytes);
        }
        Ok(())
    })
}

fn base64_encode(data: &[u8]) -> String {
    use std::fmt::Write;
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        out.push(CHARS[(b0 >> 2)] as char);
        out.push(CHARS[((b0 & 3) << 4) | (b1 >> 4)] as char);
        if chunk.len() > 1 { out.push(CHARS[((b1 & 0xf) << 2) | (b2 >> 6)] as char); } else { out.push('='); }
        if chunk.len() > 2 { out.push(CHARS[b2 & 0x3f] as char); } else { out.push('='); }
    }
    out
}

fn base64_decode(s: &str) -> Result<Vec<u8>, String> {
    let s = s.trim_end_matches('=');
    let mut out = Vec::new();
    let chars: Vec<u8> = s.bytes().map(b64_val).collect::<Result<_, _>>()?;
    for chunk in chars.chunks(4) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };
        let b3 = if chunk.len() > 3 { chunk[3] } else { 0 };
        out.push((b0 << 2) | (b1 >> 4));
        if chunk.len() > 2 { out.push((b1 << 4) | (b2 >> 2)); }
        if chunk.len() > 3 { out.push((b2 << 6) | b3); }
    }
    Ok(out)
}

fn b64_val(b: u8) -> Result<u8, String> {
    match b {
        b'A'..=b'Z' => Ok(b - b'A'),
        b'a'..=b'z' => Ok(b - b'a' + 26),
        b'0'..=b'9' => Ok(b - b'0' + 52),
        b'+' => Ok(62),
        b'/' => Ok(63),
        _ => Err(format!("invalid base64 char: {b}")),
    }
}
