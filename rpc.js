module.exports = function onrequest (req, channel, cb) {
  switch (req.method) {
    case 'BACKPACK_RETRIEVE':
      this.download(req.username, channel, cb)
      break

    case 'BACKPACK_STORE':
      this.upload(req.username, channel, cb)
      break

    default :
      return cb(new Error('unrecognised message.'))
  }
}
