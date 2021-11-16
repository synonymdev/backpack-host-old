const SpakeChannel = require('handshake-peer/spake')
const assert = require('nanoassert')
const pump = require('pump')

const rpc = require('./lib/rpc')
const { decode, RPC } = require('./lib/wire')
const read = require('./lib/reader')

module.exports = class Host {
  constructor (id, clients, storage) {
    assert(typeof clients.get === 'function')
    assert(typeof clients.set === 'function')

    this.id = id
    this.clients = clients
    this.storage = storage
  }

  createServer (connect, opts = {}) {
    const self = this

    const onerror = opts.onerror || throwMaybe
    const onrequest = (opts.onrequest || rpc).bind(this)

    assert(connect, 'Must specify a conncetion method.')

    return connect((socket) => {
      read(socket, onmessage)

      function onmessage (msg) {
        const message = decode(msg)
        switch (message.method) {
          // establish a secure channel
          case 'CONNECT' :
            self._connect(message.username, socket, onchannel)
            break

          // onetime user registration
          case 'REGISTER' :
            self.register(message)
            break
        }
      }
    })

    function onchannel (err, channel) {
      if (err) return onerror(err)

      readRequest()

      function readRequest () {
        const data = channel.read()

        if (data === null) {
          channel.once('readable', readRequest)
          return
        }

        const req = {
          method: RPC.METHODS[data[0]],
          username: channel.remoteInfo.username.toString()
        }

        if (req.method) {
          onrequest(req, channel, onerror)
        } else {
          channel.unshift(data)
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

    channel.on('error', err => {
      return cb(err)
    })

    cb(null, channel)
  }
}

function noop () {}
