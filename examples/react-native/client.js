/**
 * @format
 */

// we need to shim these
global.process = require('process')
global.process.nextTick = setImmediate

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import { Client } from  'backpack-host';
import bint from 'bint8array';
import { Readable, Duplex } from 'streamx';

import webnet from 'webnet';
import WSStream from 'webnet/websocket';

const username = bint.fromString('anon')
const password = bint.fromString('password')

const serverInfo = {
  id: bint.fromString("test123"),
  url: 'ws://localhost:4000'
}

// log output from stream
const out = new Duplex({
  write (data, cb) {
    console.log(data)
    cb()
  }
})

const client = new Client(username, password,
  // a default connect method should be passed
  // to the server; a duplex stream should be
  // passed to the callback.
  function connect (info, cb) {
    const socket = new WebSocket(info.url)
    socket.onerror = err => cb(err)

    // socket must have stream api
    const ws = new WSStream(socket, {
      onconnect: () => cb(null, ws)
    })
  }
)

// client needs to initialise key
await client.init()

// register the client with the server,
// client only has to register once
await client.register(serverInfo)

// some data to write
const data = new Uint8Array(256)
for (let i = 0; i < data.byteLength; i++) write[i] = i

// now, or at any later date we can
// store data on the remote server
await client.store(serverInfo, data)

// retrieve the data at a later point
setTimeout(async () => {
  const data = await client.retrieve(serverInfo)
  console.log(data)
}, 3000)

AppRegistry.registerComponent(appName, () => App);
