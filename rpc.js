module.exports = function onrequest (channel) {
  return msg => {
    const req = JSON.parse(msg)

    switch (req.method) {
      case 'BACKPACK_RETRIEVE':
        this.download(req.username, channel, err => {
          if (err) throw err
          channel.once('data', onrequest(channel))
        })
        break

      case 'BACKPACK_STORE':
        this.upload(req.username, channel, err => {
          if (err) throw err
          channel.once('data', onrequest(channel))
        })
        break

      // default :
      //   return new Error('unrecognised message.')
    }
  }
}
