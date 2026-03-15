use super::crypto::{decrypt, encrypt};
use super::idb::FsStore;

fn test_key() -> [u8; 32] {
    [0xde, 0xad, 0xbe, 0xef, 0xca, 0xfe, 0xba, 0xbe,
     0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
     0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80,
     0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x11, 0x22]
}

fn wrong_key() -> [u8; 32] {
    [0x00u8; 32]
}

// ─── 4.1 [RED] wasm_fs_write: stored value ≠ plaintext ─────────────────────

#[test]
fn write_stores_encrypted_not_plaintext() {
    let key = test_key();
    let plaintext = b"FLAG{secret_flag}";

    let blob = encrypt(&key, plaintext).expect("encrypt failed");

    // Stored bytes must NOT equal the plaintext
    assert_ne!(&blob.data, plaintext);
    // Stored blob must be longer (nonce + ciphertext + tag)
    assert!(blob.data.len() > plaintext.len());
}

// ─── 4.3 [RED] wasm_fs_read: correct key decrypts; wrong key errors ─────────

#[test]
fn read_with_correct_key_returns_plaintext() {
    let key = test_key();
    let plaintext = b"hello from FS";

    let blob = encrypt(&key, plaintext).expect("encrypt");
    let recovered = decrypt(&key, &blob.data).expect("decrypt");

    assert_eq!(recovered, plaintext);
}

#[test]
fn read_with_wrong_key_returns_err() {
    let key = test_key();
    let bad_key = wrong_key();
    let plaintext = b"secret data";

    let blob = encrypt(&key, plaintext).expect("encrypt");
    let result = decrypt(&bad_key, &blob.data);

    assert!(result.is_err(), "expected Err with wrong key, got Ok");
}

// ─── 4.5 [RED] wasm_fs_init: first call populates; second call skips ────────

#[test]
fn init_populates_store_when_empty() {
    let mut store = FsStore::new();
    let key = test_key();

    let entries: Vec<(&str, &[u8])> = vec![
        ("/flag.txt", b"FLAG{secret}"),
        ("/app.py", b"from flask import Flask"),
    ];

    // Simulate init: encrypt each entry and write to store
    fs_init(&mut store, &key, &entries);

    assert!(!store.is_empty());
    assert!(store.contains("/flag.txt"));
    assert!(store.contains("/app.py"));
}

#[test]
fn init_skips_when_store_already_populated() {
    let mut store = FsStore::new();
    let key = test_key();
    let entries: Vec<(&str, &[u8])> = vec![("/flag.txt", b"FLAG{secret}")];

    fs_init(&mut store, &key, &entries);

    // Overwrite /flag.txt with different content
    let marker = b"MARKER_SHOULD_NOT_BE_OVERWRITTEN";
    let blob = encrypt(&key, marker).expect("encrypt");
    store.write("/flag.txt", blob.data);

    // Second init — should NOT overwrite
    fs_init_if_empty(&mut store, &key, &entries);

    // The value should still be our marker, not the re-init value
    let raw = store.read("/flag.txt").expect("entry exists");
    let recovered = decrypt(&key, raw).expect("decrypt");
    assert_eq!(recovered, marker as &[u8]);
}

// ─── 4.7 [RED] wasm_fs_reset: deletes all then re-populates ─────────────────

#[test]
fn reset_clears_and_repopulates() {
    let mut store = FsStore::new();
    let key = test_key();
    let entries: Vec<(&str, &[u8])> = vec![("/flag.txt", b"FLAG{original}")];

    fs_init(&mut store, &key, &entries);

    // Simulate challenge state mutation
    let mutated = encrypt(&key, b"MUTATED").expect("encrypt");
    store.write("/flag.txt", mutated.data);

    // Reset
    store.delete_all();
    fs_init(&mut store, &key, &entries);

    // Should have original content
    let raw = store.read("/flag.txt").expect("entry exists");
    let recovered = decrypt(&key, raw).expect("decrypt");
    assert_eq!(recovered, b"FLAG{original}" as &[u8]);
}

// ─── helpers (stand-ins for the public WASM API) ─────────────────────────────

fn fs_init(store: &mut FsStore, key: &[u8; 32], entries: &[(&str, &[u8])]) {
    for (path, plaintext) in entries {
        let blob = encrypt(key, plaintext).expect("encrypt");
        store.write(path, blob.data);
    }
}

fn fs_init_if_empty(store: &mut FsStore, key: &[u8; 32], entries: &[(&str, &[u8])]) {
    if !store.is_empty() {
        return;
    }
    fs_init(store, key, entries);
}
