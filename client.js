const Spake = require('spake2-ee')
const SpakeChannel = require('handshake-peer/spake')
const bint = require('bint8array')
const { RegisterMessage, ConnectMessage, RPC } = require('./lib/wire')
const { encrypt, decrypt, createKey } = require('./lib/crypto')

module.exports = function Client (username, password, opts = {}) {
  const details = { username, password }
  const connect = opts.connect
  let key = null

  return {
    init,
    register,
    store,
    retrieve
  }

  function init (opts = {}) {
    if (key !== null) return

    return new Promise((resolve, reject) => {
      createKey(username, password, opts, (err, res) => {
        if (err) return reject(err)
        key = res
        resolve()
      })
    })
  }

  function encryptBackup (plaintext, pad = 128) {
    if (key === null) throw new Error('Client has not be initialised yet.')
    return encrypt(key, plaintext, pad)
  }

  function decryptBackup (ciphertext, pad = 128) {
    if (key === null) throw new Error('Client has not be initialised yet.')
    return decrypt(key, ciphertext, pad)
  }

  async function register (server, opts = {}) {
    const _connect = opts.connect || connect
    return new Promise((resolve, reject) => {
      _connect(server, (err, transport) => {
        if (err) return reject(err)

        const data = Spake.ClientSide.register(password)
        const request = new RegisterMessage(username, data)

        transport.write(frame(request.encode()))
        resolve()
      })
    })
  }

  async function store (server, data, opts = {}) {
    const chan = await channel(server, opts)

    chan.write(RPC.StoreMessage)
    chan.end(encryptBackup(data))
  }

  async function retrieve (server, opts = {}) {
    const chan = await channel(server, opts)

    const chunks = []
    chan.on('data', data => chunks.push(data))

    chan.write(RPC.RetrieveMessage)

    await new Promise((resolve, reject) => {
      chan.on('end', resolve)
      chan.on('error', reject)
    })

    return decryptBackup(bint.concat(chunks))
  }

  async function channel (server, opts = {}) {
    const _connect = opts.connect || connect

    return new Promise((resolve, reject) => {
      _connect(server, (err, transport) => {
        if (err) return reject(err)

        const request = new ConnectMessage(username)
        transport.write(frame(request.encode()))

        // spake module handles handshake
        const channel = new SpakeChannel.Client(details, server, transport)
        resolve(channel)
      })
    })
  }
}

function frame (buf) {
  const ret = new Uint8Array(2 + buf.length)
  const view = new DataView(ret.buffer, ret.byteOffset)
  view.setUint16(0, buf.length, true)
  ret.set(buf, 2)

  return ret
}
