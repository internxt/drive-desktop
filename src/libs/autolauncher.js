import AutoLaunch from 'auto-launch'

function configureAutostart() {
  const autoLaunch = new AutoLaunch({
    name: 'Internxt Drive'
  })

  autoLaunch.isEnabled().then((isEnabled) => {
    if (isEnabled && process.env.NODE_ENV === 'development') {
      autoLaunch.disable()
    } else if (!isEnabled) {
      autoLaunch.enable()
    }
  })
}

export default {
  configureAutostart
}
