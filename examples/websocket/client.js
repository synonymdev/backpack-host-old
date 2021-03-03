const fs = require('fs')
const WebSocket = require('websocket-stream')
const { Client } = require('backpack-host')

const username = Buffer.from('anon')
const password = Buffer.from('password')

const serverInfo = {
  id: Buffer.from("test123"),
  url: 'ws://localhost:4000'
}

const client = new Client(username, password, {
  connect: (info, cb) => {
    cb(null, WebSocket(info.url))
  }
})

client.register(serverInfo, (err) => {
  if (err) throw err
  client.store(serverInfo, (err, str) => {
    if (err) throw err
    fs.createReadStream('../sample.txt').pipe(str)
  })
})

process.stdin.on('data', () => {
  client.retrieve(serverInfo, (err, channel) => {
    if (err) throw err
    channel.pipe(process.stdout)
  })
})
