const FLAGS = {
  CONNECT: 0x7e,
  REGISTER: 0x7f,
  STORE: 0x3e,
  RETRIEVE: 0x3f
}

// reverse map for decoding
const METHODS = {}
for (const [k, v] of Object.entries(FLAGS)) METHODS[v] = k

const RPC = {
  FLAGS,
  METHODS,
  StoreMessage: new Uint8Array([ FLAGS.STORE ]),
  RetrieveMessage: new Uint8Array([ FLAGS.RETRIEVE ]),
}

function decode (buf, offset) {
  if (!offset) offset = 0
  const flag = buf[offset++]

  switch (flag) {
    case RPC.FLAGS.CONNECT:
      return ConnectMessage.decode(buf, offset)

    case RPC.FLAGS.REGISTER:
      return RegisterMessage.decode(buf, offset)

    default:
      throw new Error('Unrecognised message flag.')
  }
}

class ConnectMessage {
  constructor (username) {
    this.method = 'CONNECT'
    this.username = username
  }

  encode (buf, offset) {
    if (!buf) buf = new Uint8Array(this.encodingLength())
    if (!offset) offset = 0
    const startIndex = offset

    // connect flag
    buf[offset++] = RPC.FLAGS.CONNECT

    encodeUsername(this.username, buf, offset)
    offset += encodeUsername.bytes

    this.encode.bytes = offset - startIndex
    return buf
  }

  static decode (buf, offset) {
    if (!offset) offset = 0
    const startIndex = offset

    const username = decodeUsername(buf, offset)
    offset += decodeUsername.bytes

    ConnectMessage.decode.bytes = offset - startIndex
    return new ConnectMessage(username)
  }

  encodingLength () {
    return 3 + this.username.length
  }
}

class RegisterMessage {
  constructor (username, data) {
    this.method = 'REGISTER'
    this.username = username
    this.data = data
  }

  encode (buf, offset) {
    if (!buf) buf = new Uint8Array(this.encodingLength())
    if (!offset) offset = 0
    const startIndex = offset

    // registration flag
    buf[offset++] = RPC.FLAGS.REGISTER

    encodeUsername(this.username, buf, offset)
    offset += encodeUsername.bytes

    setLengthPrefix(this.data.byteLength, buf, offset)
    offset += setLengthPrefix.bytes

    buf.set(this.data, offset)
    offset += this.data.byteLength

    this.encode.bytes = offset - startIndex
    return buf
  }

  static decode (buf, offset) {
    if (!offset) offset = 0
    const startIndex = offset

    const username = decodeUsername(buf, offset)
    offset += decodeUsername.bytes

    const len = getLengthPrefix(buf, offset)
    offset += getLengthPrefix.bytes

    const data = buf.subarray(offset, offset + len)
    offset += len

    RegisterMessage.decode.bytes = offset - startIndex
    return new RegisterMessage(username, data)
  }

  encodingLength () {
    return 5 + this.username.length + this.data.byteLength
  }
}

module.exports = {
  decode,
  RegisterMessage,
  ConnectMessage,
  RPC
}

function decodeUsername (buf, offset) {
  if (!offset) offset = 0
  const startIndex = offset

  const len = getLengthPrefix(buf, offset)
  offset += getLengthPrefix.bytes

  const username = buf.subarray(offset, offset + len)
  offset += len

  decodeUsername.bytes = offset - startIndex
  return username
}

function encodeUsername (username, buf, offset) {
  if (!buf) buf = new Uint8Array(2 + username.length)
  if (!offset) offset = 0
  const startIndex = offset

  setLengthPrefix(username.byteLength, buf, offset)
  offset += setLengthPrefix.bytes

  buf.set(username, offset)
  offset += username.byteLength

  encodeUsername.bytes = offset - startIndex
  return buf
}

function setLengthPrefix (len, buf, offset) {
  if (!offset) offset = 0
  const startIndex = offset

  const view = new DataView(buf.buffer, buf.byteOffset)
  view.setUint16(offset, len, true)
  offset += 2

  setLengthPrefix.bytes = offset - startIndex
  return buf
}

function getLengthPrefix (buf, offset) {
  if (!offset) offset = 0
  const startIndex = offset

  const view = new DataView(buf.buffer, buf.byteOffset)
  const len = view.getUint16(offset, true)
  offset += 2

  getLengthPrefix.bytes = 2
  return len
}
