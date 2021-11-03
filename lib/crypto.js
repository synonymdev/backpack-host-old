const secretBlob = require('secret-blob')
const bint = require('bint8array')
const sodium = require('sodium-native')

function encrypt (key, plaintext, pad = 1024 * 128) {
  const padBuf = sodium.sodium_malloc(plaintext.byteLength + pad)
  padBuf.set(plaintext)
  const paddedLength = sodium.sodium_pad(padBuf, plaintext.byteLength, pad)
  const padded = padBuf.subarray(0, paddedLength)

  const encrypted = secretBlob.encrypt(padded, key)
  sodium.sodium_free(padBuf)
  return encrypted
}

function decrypt (key, ciphertext, pad = 1024 * 128) {
  const plaintext = secretBlob.decrypt(ciphertext, key)
  const unpaddedLength = sodium.sodium_unpad(plaintext, plaintext.byteLength, pad)

  return plaintext.subarray(0, unpaddedLength)
}

async function createKey (username, password, opts, cb) {
  if (typeof opts === 'function') return createKey(username, password, {}, opts)
  if (typeof username === 'string') return createKey(bint.fromString(username), password, {}, opts)
  if (typeof password === 'string') return createKey(username, bint.fromString(password), {}, opts)

  const opslimit = opts.opslimit ?? sodium.crypto_pwhash_OPSLIMIT_SENSITIVE
  const memlimit = opts.memlimit ?? sodium.crypto_pwhash_MEMLIMIT_SENSITIVE
  const alg = opts.alg ?? sodium.crypto_pwhash_ALG_DEFAULT

  const salt = new Uint8Array(sodium.crypto_pwhash_SALTBYTES)
  sodium.crypto_generichash(salt, username, bint.fromString('backpack_salt_001'))

  const key = sodium.sodium_malloc(32)
  await sodium.crypto_pwhash_async(key, password, salt, opslimit, memlimit, alg)

  return key
}

module.exports = {
  encrypt,
  decrypt,
  createKey
}
