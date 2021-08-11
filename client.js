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
    encryptBackup,
    decryptBackup,
    register,
    store,
    retrieve
  }

  function init (opts = {}, cb) {
    if (typeof opts === 'function') return init(null, opts)
    if (key !== null) return cb()

    createKey(username, password, opts, (err, res) => {
      if (err) return cb(err)
      key = res
      return cb()
    })
  }

  function encryptBackup (plaintext, pad) {
    if (key === null) throw new Error('Client has not be initialised yet.')
    return encrypt(key, plaintext, pad)
  }

  function decryptBackup (ciphertext, pad) {
    if (key === null) throw new Error('Client has not be initialised yet.')
    return decrypt(key, ciphertext, pad)
  }

  function register (server, opts, cb) {
    if (isFunction(opts)) return register(server, {}, opts)

    const _connect = opts.connect || connect
    _connect(server, (err, transport) => {
      if (err) return cb(err)

      const data = Spake.ClientSide.register(password)
      const request = new RegisterMessage(username, data)

      transport.write(frame(request.encode()))
      cb()
    })
  }

  function store (server, opts, cb) {
    if (isFunction(opts)) return store(server, {}, opts)

    channel(server, opts, (err, channel) => {
      if (err) return cb(err)

      channel.write(RPC.StoreMessage)
      cb(null, channel)
    })
  }

  function retrieve (server, opts, cb) {
    if (isFunction(opts)) return retrieve(server, {}, opts)

    channel(server, opts, (err, channel) => {
      if (err) return cb(err)

      channel.write(RPC.RetrieveMessage)
      cb(null, channel)
    })
  }

  function channel (server, opts, cb) {
    if (isFunction(opts)) return channel(server, {}, opts)

    const _connect = opts.connect || connect
    _connect(server, (err, transport) => {
      if (err) return cb(err)

      const request = new ConnectMessage(username)
      transport.write(frame(request.encode()))

      // spake module handles handshake
      const channel = new SpakeChannel.Client(details, server, transport)

      channel.on('error', err => {
        channel.end('error')
        return cb(err)
      })

      cb(null, channel)
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

function isFunction (obj) {
  return typeof obj === 'function'
}
