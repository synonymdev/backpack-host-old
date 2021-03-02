module.exports = function onrequest (req, channel, cb) {
  switch (req.method) {
    case 'BACKPACK_RETRIEVE':
      this.download(req.username.toString(), channel, cb)
      break

    case 'BACKPACK_STORE':
      this.upload(req.username.toString(), channel, cb)
      break

    default :
      return cb(new Error('unrecognised message.'))
  }
}
