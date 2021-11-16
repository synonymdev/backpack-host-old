const net = require('net')
const Storage = require('abstract-blob-store')
const { Host } = require('backpack-host')

const serverInfo = {
  id: Buffer.from('server1'),
  port: 5432
}

const backpack = new Host(serverInfo.id, new Map(), new Storage())

const host = backpack.createServer(net.createServer)

host.listen(serverInfo.port)

