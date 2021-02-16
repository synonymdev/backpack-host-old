const SpakeChannel = require('spake2-peer/spake')
const assert = require('nanoassert')
const pump = require('pump')

module.exports = class Server {
  constructor (id, clients, storage) {
    assert(typeof clients.get === 'function')
    assert(typeof clients.set === 'function')

    this.id = id
    this.clients = clients
    this.storage = storage
  }

  createServer (opts = {}, cb) {
    const self = this

    const connect = opts.connect

    return connect(onsocket)

    function onsocket (socket) {
      socket.once('data', msg => {
        const { method, username, data } = JSON.parse(msg)

        switch (method) {
          case 'BACKPACK_CONNECT' :
            self._connect(username, socket, cb)
            break

          case 'BACKPACK_REGISTER' :
            self.register(username, data)
            break
        }
      })
    }
  }

  register (username, info) {
    this.clients.set(username, info)
  }

  download (username, res, cb) {
    console.log(username)
    if (!cb) cb = noop

    const str = this.storage.createReadStream(username)
    pump(str, res, cb)
  }

  upload (username, req, cb) {
    if (!cb) cb = noop

    const str = this.storage.createWriteStream(username)
    pump(req, str, cb)
  }

  _connect (username, connection, cb) {
    const id = this.id
    const data = this.clients.get(username)

    const channel = new SpakeChannel.Server({ id }, {
      username,
      data
    }, { res: connection, req: connection })

    cb(null, channel)
  }
}

function noop () {}
