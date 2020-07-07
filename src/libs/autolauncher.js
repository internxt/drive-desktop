import AutoLaunch from 'auto-launch'
import Logger from '../libs/logger'

function configureAutostart() {
  const opts = {
    name: 'Internxt Drive'
  }

  if (process.platform === 'linux' && !process.env.APPIMAGE) {
    opts.path = '/opt/Internxt\\ Drive/internxt-drive'
  }
  const autoLaunch = new AutoLaunch(opts)

  autoLaunch.isEnabled().then((isEnabled) => {
    if (isEnabled && process.env.NODE_ENV === 'development') {
      Logger.info('Auto launch disabled')
      autoLaunch.disable()
    } else if (!isEnabled) {
      autoLaunch.enable()
      Logger.info('Auto start registered on the operative system')
    } else {
      Logger.info('Auto start already registered')
    }
  })
}

export default {
  configureAutostart
}
