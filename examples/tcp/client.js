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

main()

async function main () {
  await client.init()
  await client.register(serverInfo)

  const data = fs.readFileSync('../sample.txt')
  await client.store(serverInfo, data)
}

process.stdin.on('data', async () => {
  const data = await client.retrieve(serverInfo)
  console.log(data)
})
