const { Host } = require('backpack-host')
const Storage = require('abstract-blob-store')
const http = require('http')
const websocket = require('websocket-stream')

const backpack = new Host(Buffer.from('test123'), new Map(), new Storage())

const server = backpack.createServer(
  function connect (cb) {
    const app = new http.createServer()

    websocket.createServer({ server: app }, (stream) => {
      cb(stream)
    })

    return app
  }
)

server.listen(4000)
