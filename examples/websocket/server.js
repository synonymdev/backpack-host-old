const { Host } = require('backpack-host')
const store = require('fs-blob-store')
const http = require('http')
const websocket = require('websocket-stream')

const backpack = new Host(Buffer.from('test123'), new Map(), store('storage'))

const server = backpack.createServer({
  connect: (cb) => {
    const app = new http.createServer()

    websocket.createServer({ server: app }, (stream, request) => {
      cb(stream)
    })

    return app
  }
})

server.listen(4000)
