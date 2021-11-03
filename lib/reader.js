const bint = require('bint8array')

module.exports = function getFirstFrame (stream, cb) {
  let buffered = null
  let missing = 2
  let readingFrame = true

  stream.pause()
  stream.on('readable', read)

  function read () {
    let data = stream.read()
    stream.pause()

    missing -= data.byteLength

    if (buffered != null) {
      data = bint.concat(buffered, data)
      buffered = null
    }

    if (readingFrame) {
      readingFrame = false
      const view = new DataView(data.buffer, data.byteOffset)
      missing += view.getUint16(0, true)
      data = data.subarray(2)
    }

    if (missing <= 0) {
      const message = data.subarray(0, data.byteLength + missing)
      stream.unshift(data.subarray(data.byteLength + missing))
      stream.removeListener('readable', read)
      return cb(message)
    }

    buffered = data
  }
}
