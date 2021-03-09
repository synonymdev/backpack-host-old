module.exports = function onrequest (req, channel, cb) {
  switch (req.method) {
    case 'RETRIEVE':
      this.download(req.username, channel, cb)
      break

    case 'STORE':
      this.upload(req.username, channel, cb)
      break

    default :
      return cb(new Error('unrecognised message.'))
  }
}
