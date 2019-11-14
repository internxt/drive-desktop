import AutoLaunch from 'auto-launch'

function configureAutostart () {
  var xcdLauncher = new AutoLaunch({
    name: 'X Cloud Desktop'
  })

  xcdLauncher.enable()

  xcdLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        return
      }
      xcdLauncher.enable()
    }).catch(function (err) {
      console.error(err)
    })
}

export default {
  configureAutostart
}
