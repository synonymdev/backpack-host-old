# backpack-host

*This is alpha software: this should __not__ be used in production and breaking changes may occur without warning*

backpack-host is an encrypted backup service that uses a Password-Authenticated Key Agreement based on SPAKE2+EE https://github.com/jedisct1/spake2-ee, meaning client's passwords are neither transmitted nor stored on the server.

## Usage

```js
const { Host, Client } = require('backpack-host')

const backpack = new Host(hostId, new Map(), new Storage())
const server = backpack.createServer(
  async function connect (onsocket) {
    // logic to establish a connection
  },
  {
    onrequest (req, channel, cb) {
      // handle JSON request here
      cb()
    }
  })

// tcp default
server.listen(port)

// make new client
const client = new Client(username, password)

// register with a server
const serverInfo = await client.register(serverInfo)

// store data with server
const stream = await client.store(serverInfo)
fs.createReadStream('./samples/1.txt').pipe(str)

// sometime later //

// retrieve data from server
const backup = await client.retrieve(serverInfo)
backup.pipe(process.stdout)
```

## API

### Host

#### ``const backpack = new Host(id, clients, storage)``

Instantiate a new Host, with `id` given as a Buffer or Uint8Array.

`clients` should be a data adapter exposing a `clients.get` and `clients.set` method, this is used to store registration data for users.

`storage` should be an [blob-store](https://github.com/maxogden/abstract-blob-store) compatible storage module provided by the application. User backups are stored here.

#### ``const server = backpack.createServer(connect, opts)``

Create a new server to listen for incoming connections. A method for connecting to clients must be specified by the `connect` parameter.

`connect` is used to instantiate the server, eg. `net.createServer`, and should return the server instance. See [examples](./examples) for usage. `connect` should take an `onconnection` handler as a callback.

`opts` may be used to pass in `onrequest` and `onerror` handlers. `onrequest` should be a callback function specifying the RPC logic for the server. `onrequest` should have the signature: `function (req, channel, cb)`, and `cb` MUST be called after each request has finished.

**NOTE**: for upload/download events, cb should be called AFTER the upload/download stream has fully closed.

A default RPC provides the following methods:
```
BACKPACK_STORE
BACKPACK_RETRIEVE
```

#### ``backpack.register(username, info)``

Internal method to register a new user.


#### ``backpack.download(username, res, info)``

Writes the users requested data into the `res`.


#### ``backpack.upload(username, req, info)``

Reads from `req` and stores the data under the user.

### Client

#### `const user = new Client(username, password, [connect])`

Instantiate a new client instance with the given `username` and `password`. `username` and `password` should be Buffers.

Default connection logic for the client may be specified via the `connect` parameter:
```js
connect: (serverInfo, cb) => {
  // implement connection logic
  cb(err, stream)
}
```

#### `await user.init([opts])`

Initialise the client. This method derives the encryption and must be called before encryption/decryption.

By default, Argon2d is used with `crypto_pwhash_OPSLIMIT_SENSITIVE` and `crypto_pwhash_MEMLIMIT_SENSITIVE`. Alternative parameters may be specified with `opts`. See [sodium-native](https://sodium-friends.github.io/docs/docs/passwordhashing#crypto_pwhash) for other details.

`opts`:
```
{
  opslimit,
  memlimit,
  alg
}
```

Constants:
```
// ~1s on iOS/Andorid emulator
crypto_pwhash_OPSLIMIT_INTERACTIVE
crypto_pwhash_MEMLIMIT_INTERACTIVE

// ~3s on iOS/Andorid emulator
crypto_pwhash_OPSLIMIT_MODERATE
crypto_pwhash_MEMLIMIT_MODERATE

// ~10s on iOS/Andorid emulator
crypto_pwhash_OPSLIMIT_SENSITIVE
crypto_pwhash_MEMLIMIT_SENSITIVE
```

#### `await user.register(serverDetails, [opts])`

Register this user with a given server. `serverDetails` should contain the info expected by the clients `connect` method.

Connection logic is configurable by passing in `opts.connect`.

#### `await user.store(serverDetails, [opts])`

Returns a stream to write data to be stored on the remote server. `serverDetails` should contain the info expected by the clients `connect` method.

Connection logic is configurable by passing in `opts.connect`.

#### `const data = await user.retrieve(serverDetails, [opts])`

Return a stream of this users stored data from the remote server. `serverDetails` should contain the info expected by the clients `connect` method.

Connection logic is configurable by passing in `opts.connect`.
