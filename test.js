const assert = require('nanoassert')
const net = require('net')
const fs = require('fs')
const SpakeChannel = require('spake2-peer/spake')

const { Server, Client } = require('./tcp')
const serverId = Buffer.from('server1')
const streamx = require('streamx')

const username = Buffer.from('anon')
const password = Buffer.from('password')

const username2 = Buffer.from('anon2')
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

const server = Server(serverId)
server.listen(serverInfo.port)

client = new Client(username, password)
client2 = new Client(username2, password2)

client.register(serverInfo, () => {
  client.store(serverInfo, (str) => {
    fs.createReadStream('./samples/1.txt').pipe(str)
  })
})

client2.register(serverInfo, () => {
  client2.store(serverInfo, (str) => {
    fs.createReadStream('./samples/2.txt').pipe(str)
  })
})

process.stdin.on('data', function (data) {
  let uname, pwd;

  switch (data.toString()[0]) {
    case '1' :
      uname = username
      pwd = password
      break

    case '2' :
      uname = username2
      pwd = password2
      break

    default :
      return
  }

  const client2 = new net.Socket()
  client2.connect(5432, () => {
    const channel = new SpakeChannel.Client({ username: uname, password: pwd }, { serverId }, { req: client2, res: client2 })
    channel.pipe(out)
    msg = {
      method: 'BACKPACK_RETRIEVE',
      username: uname
    }

    client2.write(JSON.stringify(msg))
  })
})
