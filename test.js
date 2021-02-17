const net = require('net')
const fs = require('fs')

const Storage = require('abstract-blob-store')
const streamx = require('streamx')

const Client = require('./client')
const Backpack = require('./host')

const username = 'anon'
const password = Buffer.from('password')

const username2 = 'anon2'
const password2 = Buffer.from('password2')

const serverInfo = {
  id: Buffer.from('server1'),
  port: 5432
}

const out = new streamx.Duplex({
  write (data, cb) {
    console.log(data.toString())
    cb()
  }
})

const backpack = new Backpack(serverInfo.id, new Map(), new Storage())

const server = backpack.createServer({
  connect: net.createServer
})

server.listen(serverInfo.port)

const client = new Client(username, password)
const client2 = new Client(username2, password2)

setTimeout(() => {
  client.register(serverInfo, (err) => {
    if (err) throw err
    client.store(serverInfo, (err, str) => {
      if (err) throw err
      fs.createReadStream('./samples/1.txt').pipe(str)
    })
  })

  client2.register(serverInfo, (err) => {
    if (err) throw err
    client2.store(serverInfo, (err, str) => {
      if (err) throw err
      fs.createReadStream('./samples/2.txt').pipe(str)
    })
  })
})

process.stdin.on('data', function (data) {
  switch (data.toString()[0]) {
    case '1' :
      client.retrieve(serverInfo, (err, channel) => {
        if (err) throw err
        channel.pipe(out)
      })
      break

    case '2' :
      client2.retrieve(serverInfo, (err, channel) => {
        if (err) throw err
        channel.pipe(out)
      })
      break
  }
})
