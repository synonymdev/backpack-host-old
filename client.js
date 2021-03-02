const Spake = require('spake2-ee')
const SpakeChannel = require('handshake-peer/spake')
const { RegisterMessage, ConnectMessage } = require('./wire')

module.exports = function Client (username, password, opts = {}) {
  const details = { username, password }
  const connect = opts.connect

  return {
    register,
    store,
    retrieve
  }

  function register (server, cb) {
    connect(server, (err, transport) => {
      if (err) return cb(err)

      const data = Spake.ClientSide.register(password)
      const request = new RegisterMessage(username, data)

      transport.write(frame(request.encode()))
      cb()
    })
  }

  function store (server, cb) {
    channel(server, (err, channel) => {
      if (err) return cb(err, channel)

      channel.write(encode({
        method: 'BACKPACK_STORE',
        username
      }))

      cb(null, channel)
    })
  }

  function retrieve (server, cb) {
    channel(server, (err, channel) => {
      if (err) return cb(err, channel)

      channel.write(encode({
        method: 'BACKPACK_RETRIEVE',
        username
      }))

      cb(null, channel)
    })
  }

  function channel (server, opts, cb) {
    if (typeof opts === 'function') return channel(server, {}, opts)

    const _connect = opts.connect || connect
    _connect(server, (err, transport) => {
      if (err) return cb(err)

      const request = new ConnectMessage(username)
      transport.write(frame(request.encode()))

      try {
        // spake module handles handshake
        const channel = new SpakeChannel.Client(details, server, transport)
        cb(null, channel)
      } catch (e) {
        cb(e)
      }
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

function encode (json) {
  return new TextEncoder().encode(JSON.stringify(json))
}
