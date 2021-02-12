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

function Server (id, clients = new Map(), storage = new Storage(), cb) {
  const backup = new backpack(id, clients, storage)

  return net.createServer(socket => {
    socket.once('data', parseRequest)

    function parseRequest (msg) {
      console.log(msg)
      const req = JSON.parse(msg)
      console.log(req)

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

function Client (username, password) {
  return {
    register,
    store,
    retrieve
  }

  function register (server, cb) {
    connect(server, 'register', cb)
  }

  function store (server, cb) {
    return connect(server,'store', cb)
  }

  function retrieve (server, cb) {
    return connect(server, 'retrieve', cb)
  }

  function _register (client) {
    const data = Buffer.from(Spake.ClientSide.register(password))

    return {
      method: 'BACKPACK_REGISTER',
      username,
      data
    }
  }

  function _stream (serverId, client, method, cb) {
    let channel = new SpakeChannel.Client({ username, password }, { serverId }, {
      req: client,
      res: client
    })

    client.write(JSON.stringify({
      method,
      username
    }))

    cb(channel)
  }

  function connect (server, op, cb) {
    if (typeof op === 'function') return connect(server, null, op)

    const method = 'BACKPACK_' + op.toUpperCase()

    console.log(cb)
    const client = new net.Socket()
    client.connect(server.port, () => {
      switch (op) {
        case 'register':
          client.write(JSON.stringify(_register()))
          return cb()

        case 'store' :
          _stream(server.id, client, method, cb)
          break

        case 'retrieve' :
          _stream(server.id, client, method, cb)
          break

        default :
          return
      }
    })
  }
}
