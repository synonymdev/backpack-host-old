const assert = require('nanoassert')
const net = require('net')
const Storage = require('abstract-blob-store')
const Spake = require('spake2-ee')
const SpakeChannel = require('spake2-peer/spake')
const backpack = require('./')

module.exports = {
  Server,
  Client
}

function Server (id, clients = new Map(), storage = new Storage(), opts = {}) {
  const backup = new backpack(id, clients, storage)

  const connect = opts.connect || net.createServer

  return connect(socket => {
    socket.once('data', parseRequest)

    function parseRequest (msg) {
      const req = JSON.parse(msg)

      assert(req.method.slice(0, 8) === 'BACKPACK', 'unrecognised message.')

      switch (req.method.slice(9).toLowerCase()) {
        case 'register':
          backup.register(Buffer.from(req.username), req.data)
          socket.once('data', parseRequest)
          break

        case 'retrieve':
          backup.upload(Buffer.from(req.username), { req: socket, res: socket }, () => {
            socket.once('data', parseRequest)
          })
          break

        case 'store':
          backup.download(Buffer.from(req.username), { req: socket, res: socket }, () => {
            socket.once('data', parseRequest)
          })
          break
      }
    }
  })
}

function Client (username, password, opts = {}) {
  const connect = opts.connect || _connect

  return {
    register,
    store,
    retrieve
  }

  function register (server, cb) {
    connect(server, transport => {
      const data = Buffer.from(Spake.ClientSide.register(password))
      const request = {
        method: 'BACKPACK_REGISTER',
        username,
        data
      }

      transport.req.write(JSON.stringify(request))
      cb()
    })
  }

  function store (server, cb) {
    return _stream(server, 'BACKPACK_STORE', cb)
  }

  function retrieve (server, cb) {
    return _stream(server, 'BACKPACK_RETRIEVE', cb)
  }

  function _stream (server, method, cb) {
    connect(server, transport => {
      let channel = new SpakeChannel.Client({ username, password }, server, transport)

      transport.req.write(JSON.stringify({
        method,
        username
      }))

      return cb(channel)
    })
  }

  function _connect (server, cb) {
    const client = new net.Socket()
    client.connect(server.port, () => {
      const transport = {
        req: client,
        res: client
      }

      return cb(transport)
    })
  }
}
