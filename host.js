const SpakeChannel = require('handshake-peer/spake')
const assert = require('nanoassert')
const pump = require('pump')

const rpc = require('./rpc')
const { decode } = require('./wire')
const read = require('./reader')

module.exports = class Host {
  constructor (id, clients, storage) {
    assert(typeof clients.get === 'function')
    assert(typeof clients.set === 'function')

    this.id = id
    this.clients = clients
    this.storage = storage
  }

  createServer (opts = {}, onrequest) {
    const self = this

    const onerror = opts.onerror || throwMaybe
    if (!onrequest) onrequest = rpc.bind(this)

    const connect = opts.connect

    return connect(socket => {
      read(socket, onmessage)

      function onmessage (msg) {
        const message = decode(msg)
        switch (message.method) {
          // establish a secure channel
          case 'BACKPACK_CONNECT' :
            self._connect(message.username, socket, onchannel)
            recv.removeListener('data', onmessage)
            break

          // onetime user registration
          case 'BACKPACK_REGISTER' :
            self.register(message)
            break
        }
      }
    })

    function onchannel (err, channel) {
      if (err) return onerror(err)
      channel.on('data', ondata)

      function ondata (data) {
        try {
          const req = parseJSON(new Uint8Array(data))
          onrequest(req, channel, onerror)
        } catch (e) {
          // ignore data passed to be stored
          if (e.name !== 'SyntaxError') return onerror(err)
        }
      }
    }

    function throwMaybe (err) {
      if (err) throw err
    }
  }

  register ({ username, data }) {
    this.clients.set(username.toString(), data)
  }

  download (username, res, cb) {
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
    const data = this.clients.get(username.toString())

    // spake module handles the handshake
    const channel = new SpakeChannel.Server({ id }, {
      username,
      data
    }, connection)

    cb(null, channel)
  }
}

function noop () {}

function parseJSON (buf) {
  const str = new TextDecoder().decode(buf)
  return JSON.parse(str)
}
