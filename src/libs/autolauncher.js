import AutoLaunch from 'auto-launch'

function configureAutostart () {
  const xcdLauncher = new AutoLaunch({
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
