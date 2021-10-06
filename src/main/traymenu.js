import path from 'path'
import PackageJson from '../../package.json'
import { Tray, Menu, app } from 'electron'

var email

class TrayMenu {
  constructor(mainWindow) {
    this.tray = null
    this.mainWindow = mainWindow
  }

  init() {
    const trayIcon = this.iconPath()

    this.tray = new Tray(trayIcon)

    this.tray.setIgnoreDoubleClickEvents(true)

    this.tray.setToolTip('Internxt Drive ' + PackageJson.version)
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

  iconPath(isLoading = false) {
    const iconName = isLoading ? 'sync-icon' : 'tray-icon'

    // Default icon
    let trayIcon = path.join(
      __dirname,
      '../../src/resources/icons/' + iconName + '@2x.png'
    )

    // Template icon for mac
    if (process.platform === 'darwin') {
      trayIcon = path.join(
        __dirname,
        '../../src/resources/icons/' + iconName + '-macTemplate@2x.png'
      )
    }

    return trayIcon
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

  updateContextMenu(user) {
    const ctxMenu = this.generateContextMenu(user)
    this.tray.setContextMenu(ctxMenu)
  }

  updateSyncState() {
    const ctxMenu = this.generateContextMenu(email)
    this.tray.setContextMenu(ctxMenu)
  }

  setToolTip(text) {
    this.tray.setToolTip(text)
  }

  displayBallon(title, content) {
    if (this.tray) {
      this.tray.displayBalloon({
        title: title,
        content: content
      })
    }
  }

  appClose() {
    app.emit('app-close')
  }

  setImage(imagePath) {
    this.tray.setImage(imagePath)
  }

  setIsLoadingIcon(isLoading) {
    const newImage = this.iconPath(isLoading)
    this.setImage(newImage)
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}

export default TrayMenu
