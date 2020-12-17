import { auto } from 'async'
import AutoLaunch from 'auto-launch'
import Logger from '../libs/logger'
import ConfigStore from '../main/config-store'

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
      ConfigStore.set('autoLaunch', false)
    } else {
      const auto = ConfigStore.get('autoLaunch')
      if (isEnabled !== auto) {
        if (auto) {
          Logger.info('Auto launch enabled')
          autoLaunch.enable()
        } else {
          Logger.info('Auto launch disabled')
          autoLaunch.disable()
        }
      }
    }
  })
}

export default {
  configureAutostart
}
