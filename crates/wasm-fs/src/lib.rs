pub mod crypto;
pub mod idb;
mod wasm_api;

pub use crypto::{decrypt, encrypt};
pub use idb::FsStore;

#[cfg(test)]
mod tests;
