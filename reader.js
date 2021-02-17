const { Transform } = require('streamx')
const bint = require('bint8array')

module.exports = class Reader extends Transform {
  constructor () {
    super()

    this._readingFrame = true
    this._missing = 2
    this._buffered = null
  }

  _transform (data, cb) {
    while (data.byteLength > 0) {
      if (this._buffered) {
        data = bint.concat([this._buffered, data])
        this._buffered = null
      }

      if (data.byteLength < this.missing) {
        this._buffered = data
        return cb()
      }

      if (this._readingFrame) {
        this._readingFrame = false
        const view = new DataView(data.buffer, data.byteOffset)
        this._missing = view.getUint16(0, true)
        data = data.slice(2)
        continue
      }

      const message = new Uint8Array(data.slice(0, this._missing))
      data = new Uint8Array(data.slice(this._missing))

      this._missing = 2
      this._buffered = null

      this.push(message)
    }
  }
}
