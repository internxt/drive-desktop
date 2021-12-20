import path from 'path'
import PackageJson from '../../package.json'
import { Tray, Menu, app, nativeImage } from 'electron'

export const TrayMenuState = {
  STANDBY: 'standby',
  SYNCING: 'syncing',
  ISSUES: 'issues'
}

class TrayMenu {
  constructor() {
    this.tray = null
  }

  init() {
    const trayIcon = this.getIconPath(TrayMenuState.STANDBY)

    this.tray = new Tray(trayIcon)

    this.setState(TrayMenuState.STANDBY)

    this.tray.setIgnoreDoubleClickEvents(true)

    if (process.platform !== 'linux') {
      this.tray.on('click', (_, bounds) => {
        app.emit('show-main-windows', bounds)
        this.tray.setContextMenu(null)
      })
      this.tray.on('right-click', () => {
        this.updateContextMenu()
        this.tray.popUpContextMenu()
      })
    }

    this.updateContextMenu()
  }

  getIconPath(state) {
    return path.join(__dirname, `../../src/resources/icons/${state}.png`)
  }
  generateContextMenu() {
    const contextMenuTemplate = []
    contextMenuTemplate.push(
      {
        label: 'Show/Hide',
        click: function() {
          app.emit('show-main-windows')
        }
      },
      {
        label: 'Quit',
        click: this.appClose
      }
    )

    return Menu.buildFromTemplate(contextMenuTemplate)
  }

  updateContextMenu() {
    const ctxMenu = this.generateContextMenu()
    this.tray.setContextMenu(ctxMenu)
  }

  appClose() {
    app.emit('app-close')
  }

  setState(state) {
    const iconPath = this.getIconPath(state)
    this.setImage(iconPath)

    this.setTooltip(state)
  }

  setImage(imagePath) {
    const image = nativeImage.createFromPath(imagePath)
    if (process.platform === 'darwin') image.setTemplateImage(true)
    this.tray.setImage(image)
  }

  setTooltip(state) {
    if (state === TrayMenuState.SYNCING) {
      this.tray.setToolTip('Sync in process')
    } else if (state === TrayMenuState.ISSUES) {
      this.tray.setToolTip('There are some issues with your sync')
    } else {
      this.tray.setToolTip('Internxt Drive ' + PackageJson.version)
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}

export default TrayMenu
