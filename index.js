const SpakeChannel = require('spake2-peer/spake')
const assert = require('nanoassert')
const net = require('net')

module.exports = class Host {
  constructor (id, clients, storage) {
    assert(typeof clients.get === 'function')
    assert(typeof clients.set === 'function')

    this.id = id
    this.clients = clients
    this.storage = storage
  }

  register (username, info) {
    this.clients.set(username.toString(), info)
  }

  upload (username, connection, cb) {
    const self = this

    this._connect(username, connection, (err, username, res)  => {
      const str = self.storage.createReadStream(username.toString())
      str.pipe(res)

      res.on('finish', cb)
    })
  }

  download (username, connection, cb) {
    const self = this

    this._connect(username, connection, (err, username, res) => {
      const str = self.storage.createWriteStream(username.toString())
      res.pipe(str)

      res.on('end', cb)
    }) 
  }

  _connect (username, connection, cb) {
    const id = this.id
    const data = this.clients.get(username.toString())
    const channel = new SpakeChannel.Server({ id }, { username, data }, connection)

    cb(null, username, channel)
  }
}
