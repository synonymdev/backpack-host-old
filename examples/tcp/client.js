const net = require('net')
const fs = require('fs')

const { Client } = require('backpack-host')

const username = 'anon'
const password = Buffer.from('password')

const serverInfo = {
  id: Buffer.from('server1'),
  port: 5432
}

const client = new Client(username, password, {
  connect: (server, cb) => {
    const client = new net.Socket()
    client.connect(server.port, (err) => {
      if (err) return cb(err)
      return cb(null, client)
    })
  }
})

client.register(serverInfo, (err) => {
  if (err) throw err
  client.store(serverInfo, (err, str) => {
    if (err) throw err
    fs.createReadStream('../sample.txt').pipe(str)
  })
})

process.stdin.on('data', function (data) {
  client.retrieve(serverInfo, (err, channel) => {
    if (err) throw err
    channel.pipe(process.stdout)
  })
})
