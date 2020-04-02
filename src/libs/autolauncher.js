import AutoLaunch from 'auto-launch'

function configureAutostart () {
  var xcdLauncher = new AutoLaunch({
    name: 'Internxt Drive'
  })

  xcdLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        xcdLauncher.disable()
      }
    }).catch(function (err) {
      console.error(err)
    })
}

export default {
  configureAutostart
}
