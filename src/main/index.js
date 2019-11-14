'use strict'

import { app, BrowserWindow, Tray, Menu } from 'electron'
import path from 'path'
import AutoStart from '../libs/autolauncher'

AutoStart.configureAutostart()

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

let tray

if (process.platform === 'darwin') {
  app.dock.hide()
}

app.on('second-instance', (event, argv, cwd) => {
  console.log('Second instance')
  app.quit()
})

function destroyTray () {
  if (tray) {
    tray.destroy()
    tray = null
    mainWindow = null
  }
  app.quit()
}

function createWindow () {
  /**
   * Initial window options
   */

  BrowserWindow.prototype.$app = app
  mainWindow = new BrowserWindow({
    height: 550,
    useContentSize: true,
    width: 500,
    frame: false,
    autoHideMenuBar: true
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    destroyTray()
    mainWindow = null
  })

  let trayIcon = path.join(__dirname, '../resources/icons/tray-icon@2x.png')

  if (process.env.NODE_ENV === 'production') {
    trayIcon = path.join(__dirname, '../../src/resources/icons/tray-icon@2x.png')
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('X Cloud Desktop')

  const contextMenu = () => Menu.buildFromTemplate([
    {
      label: 'Quit',
      role: 'quit'
    }
  ])

  tray.setContextMenu(contextMenu())
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  destroyTray()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', function (evt) {
  tray.destroy()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
