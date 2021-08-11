# backpack-host
Host for "Backups with password-authenticated cryptographic key servers" based on SPAKE2+EE https://github.com/jedisct1/spake2-ee

## Usage

```js
const { Host, Client } = require('backpack-host')

const backpack = new Host(hostId, new Map(), new Storage())
const server = backpack.createServer({
  connect: function (onsocket) {
    // logic to establish a connection
  }
}, function onrequest (req, channel, cb) {
  // handle JSON request here
  cb()
})

// tcp default
server.listen(port)

const client = new Client(username, password)

client.register(serverInfo, (err) => {
  if (err) throw err
  client.store(serverInfo, (err, str) => {
    if (err) throw err
    fs.createReadStream('./samples/1.txt').pipe(str)
  })
})
```

## API

### Host

#### ``const backpack = new Host(id, clients, storage)``

Instantiate a new Host, with `id` given as a Buffer or Uint8Array.

`clients` should be a data adapter exposing a `clients.get` and `clients.set` method, this is used to store registration data for users.

`storage` should be an [blob-store](https://github.com/maxogden/abstract-blob-store) compatible storage module provided by the application. User backups are stored here.

#### ``const server = backpack.createServer(opts, onrequest)``

Create a new server to listen for incoming connections. Default connection is made using `net.createServer`, but conncetion logic may be specified by `opts.connect`.

`onrequest` should be a callback function specifying the RPC logic for the server. `onrequest` should have the signature: `function (req, channel, cb)`, and `cb` MUST be called after each request has finished 

**NOTE**: for upload/download events, cb should be called AFTER the uploadl/download stream has fully closed.

A defualt RPC provides the following methods:
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

#### `const user = new Client(username, password, opts)`

Instantiate a new client instance with the given `username` and `password`. `username` and `password` should be Buffers.

Default connection logic for the client may be specified via `opts.connect`:
```js
{
  connect: (serverInfo, cb) => {
    // implement connection logic
  }
}
```

#### `user.init([opts], cb)`

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

#### `const ciphertext = user.encryptBackup(plaintext, pad)`

Encrypt `plaintext` with the user's encryption key. `pad` may be used to define the number of bytes to pad up to, the default is 128kB.

#### `const plaintext = user.decryptBackup(ciphertext, pad)`

Decrypt `ciphertext` with the user's encryption key. `pad` should correspond to the padding used for encryption, the default is 128kB.

#### `user.register(serverDetails, [opts], cb)`

Register this user with a given server. `serverDetails` should contain the info expected by the clients `connect` method.

Connection logic is configurable by passing in `opts.connect`.

#### `user.store(serverDetails, [opts], cb)`

Returns a stream to write data to be stored on the remote server. `serverDetails` should contain the info expected by the clients `connect` method.

Upon successful handshake completion, callback will be call with `cb(null, channel)` where `channel` is an E2E encrypted secure channel.

Connection logic is configurable by passing in `opts.connect`.

#### `user.retrieve(serverDetails, [opts], cb)`

Return a stream of this users stored data from the remote server. `serverDetails` should contain the info expected by the clients `connect` method.

Upon successful handshake completion, callback will be call with `cb(null, channel)` where `channel` is an E2E encrypted secure channel.

Connection logic is configurable by passing in `opts.connect`.

#### `user.channel(serverDetails, [opts], cb)`

Establish a secure channel with the server. `serverDetails` should contain the info expected by the clients `connect` method. Callback will be call with `cb(null, channel)` where `channel` is an E2E encrypted secure channel.

Connection logic is configurable by passing in `opts.connect`.
