const fs = require('fs')
const WebSocket = require('websocket-stream')
const { Client } = require('backpack-host')

const username = Buffer.from('anon')
const password = Buffer.from('password')

const serverInfo = {
  id: Buffer.from("test123"),
  url: 'ws://localhost:4000'
}

const client = new Client(username, password,
  function connect (info, cb) {
    cb(null, WebSocket(info.url))
  }
)

main()

async function main () {
  await client.init()
  await client.register(serverInfo)

  const data = fs.readFileSync('../sample.txt')
  await client.store(serverInfo, data)

  console.log('client is ready!')

  process.stdin.on('data', async () => {
    const data = await client.retrieve(serverInfo)
    console.log(data.toString())
  })
}
