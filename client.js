const net = require('net')
const Spake = require('spake2-ee')
const SpakeChannel = require('spake2-peer/spake')

module.exports = function Client (username, password, opts = {}) {
  const details = { username, password }
  const connect = opts.connect || _connect

  return {
    register,
    store,
    retrieve
  }

  function register (server, cb) {
    connect(server, (err, transport) => {
      if (err) return cb(err)

      const data = Buffer.from(Spake.ClientSide.register(password))
      const request = {
        method: 'BACKPACK_REGISTER',
        username,
        data
      }

      transport.write(JSON.stringify(request))
      cb()
    })
  }

  function store (server, cb) {
    channel(server, (err, channel) => {
      if (err) return cb(err, channel)

      channel.write(JSON.stringify({
        method: 'BACKPACK_STORE',
        username
      }))

      cb(null, channel)
    })
  }

  function retrieve (server, cb) {
    channel(server, (err, channel) => {
      if (err) return cb(err, channel)

      channel.write(JSON.stringify({
        method: 'BACKPACK_RETRIEVE',
        username
      }))

      cb(null, channel)
    })
  }

  function channel (server, opts, cb) {
    if (typeof opts === 'function') return channel(server, {}, opts)

    const connect = opts.connect || _connect
    connect(server, (err, transport) => {
      if (err) return cb(err)

      transport.write(JSON.stringify({
        method: 'BACKPACK_CONNECT',
        username
      }))

      try {
        const channel = new SpakeChannel.Client(details, server, {
          req: transport,
          res: transport
        })
        cb(null, channel)
      } catch (e) {
        cb(e)
      }
    })
  }

  function _connect (server, cb) {
    const client = new net.Socket()
    client.connect(server.port, (err) => {
      if (err) return cb(err)
      return cb(null, client)
    })
  }
}
