'use strict'

import { app, BrowserWindow, Tray, Menu, shell, dialog } from 'electron'
import path from 'path'
import Logger from '../libs/logger'
import AutoLaunch from '../libs/autolauncher'
import { autoUpdater } from 'electron-updater'
import semver from 'semver'
import PackageJson from '../../package.json'
import fetch from 'electron-fetch'
import fs from 'fs'

AutoLaunch.configureAutostart()

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, tray

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

if (process.platform === 'darwin') {
  app.dock.hide()
}

if (app.requestSingleInstanceLock()) {
  if (mainWindow) {
    mainWindow.hide()
  }
}

app.on('second-instance', (event, argv, cwd) => {
  console.log('Second instance')
  app.quit()
})

function destroyTray() {
  if (tray) {
    tray.destroy()
  }
  tray = null
  mainWindow = null
}

function getTrayIcon(isLoading) {
  const iconName = isLoading ? 'sync-icon' : 'tray-icon'

  let trayIcon = path.join(__dirname, '../../src/resources/icons/' + iconName + '@2x.png')

  if (process.platform === 'darwin') {
    trayIcon = path.join(__dirname, '../../src/resources/icons/' + iconName + '-macTemplate@2x.png')
  }

  if (tray) {
    tray.setImage(trayIcon)
  }

  return trayIcon
}

const contextMenu = async (userEmail) => {
  let userMenu = []
  if (userEmail) {
    userMenu = [
      {
        label: userEmail,
        enabled: false
      },
      {
        type: 'separator'
      },
      {
        label: 'Change sync folder',
        click: function () {
          const newDir = dialog.showOpenDialogSync({ properties: ['openDirectory'] })
          if (newDir && newDir.length > 0 && fs.existsSync(newDir[0])) {
            app.emit('new-folder-path', newDir[0])
          } else {
            Logger.info('Sync folder change error or cancelled')
          }
        }
      }
    ]
  } else {
    console.log('xUser is not set, skip from menu')
  }
  const contextMenuTemplate = [
    {
      label: 'Open folder',
      click: function () {
        app.emit('open-folder')
      }
    },
    {
      label: 'Force sync',
      click: function () {
        app.emit('sync-start')
      }
    },
    {
      label: 'Billing',
      click: function () { shell.openExternal(`${process.env.API_URL}/storage`) }
    },
    {
      label: 'Log out',
      click: function () {
        app.emit('user-logout')
      }
    },
    {
      label: 'Quit',
      click: appClose
    }
  ]
  return Menu.buildFromTemplate(Array.concat(userMenu, contextMenuTemplate))
}

async function updateContextMenu(tray, user) {
  const ctxMenu = await contextMenu(user)
  tray.setContextMenu(ctxMenu)
}

app.on('update-menu', (user) => {
  if (tray) {
    updateContextMenu(tray, user)
  } else {
    console.log('no tray to update')
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 500,
    height: 550,
    useContentSize: true,
    frame: process.env.NODE_ENV === 'development',
    autoHideMenuBar: true,
    skipTaskbar: process.env.NODE_ENV !== 'development',
    show: process.env.NODE_ENV === 'development'
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', appClose)
  mainWindow.on('close', appClose)

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: function () {
          self.getWindow().webContents.undo()
        }
      }, {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Y',
        click: function () {
          self.getWindow().webContents.redo()
        }
      }, {
        type: 'separator'
      }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        click: function () {
          self.getWindow().webContents.cut()
        }
      }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        click: function () {
          self.getWindow().webContents.copy()
        }
      }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        click: function () {
          self.getWindow().webContents.paste()
        }
      }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: function () {
          self.getWindow().webContents.selectAll()
        }
      }
    ]
  }

  const editMacOS = {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { role: 'selectall' }
    ]
  }

  const view = {
    label: 'View',
    submenu: [
      {
        label: 'Developer Tools',
        accelerator: 'Shift+CmdOrCtrl+J',
        click: function () {
          self.getWindow().toggleDevTools()
        }
      }
    ]
  }

  const windowMenu = Menu.setApplicationMenu(
    Menu.buildFromTemplate([process.platform === 'darwin' ? editMacOS : edit, view])
  )

  const trayIcon = getTrayIcon()

  tray = new Tray(trayIcon)
  tray.setToolTip('Internxt Drive ' + PackageJson.version)

  updateContextMenu(tray)
}

app.on('ready', () => {
  createWindow()
})

function appClose() {
  if (mainWindow) {
    mainWindow.destroy()
  }
  if (process.platform !== 'darwin') { app.quit() }
  destroyTray()
}

app.on('window-all-closed', () => {
  appClose()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', function (evt) {
  if (tray) {
    tray.destroy()
  }
})

app.on('browser-window-focus', (e, w) => {
})

app.on('sync-on', function () {
  tray.setImage(getTrayIcon(true))
})

app.on('sync-off', function () {
  tray.setImage(getTrayIcon(false))
})

function maybeShowWindow() {
  if (mainWindow) {
    mainWindow.show()
  } else {
    app.on('window-show', function () {
      if (mainWindow) {
        mainWindow.show()
      }
    })
  }
}

maybeShowWindow()

app.on('show-bubble', (title, content) => {
  if (tray) {
    tray.displayBalloon({
      title: title,
      content: content
    })
  }
})

app.on('window-hide', function () {
  if (mainWindow) {
    if (process.env.NODE_ENV !== 'development') {
      mainWindow.hide()
    }
  }
})

app.on('set-tooltip', msg => {
  tray.setToolTip(`Internxt Drive ${PackageJson.version}${(msg ? '\n' + msg : '')}`)
})

/**
 * Auto Updater
 *
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

autoUpdater.logger = Logger

if (process.env.NODE_ENV === 'development') {
  // Only for testing
  autoUpdater.updateConfigPath = 'dev-app-update.yml'
  autoUpdater.currentVersion = '10.0.0'
}

autoUpdater.on('error', (err) => {
  console.log('AUTOUPDATE ERROR', err.message)
})

autoUpdater.on('checking-for-update', () => {
  // console.log('CHECKING FOR UPDATE EVENT')
})

autoUpdater.on('update-available', () => {
  // console.log('AUTOUPDATER UPD AVAIL')
})

autoUpdater.on('update-not-available', () => {
  console.log('NO UPDATES')
})

autoUpdater.on('download-progress', (progress) => {
  // console.log('UPDATE DOWNLOAD', progress.percent)
})

autoUpdater.on('update-downloaded', (info) => {
  Logger.info('New update downloaded, quit and install')
  AnnounceUpdate(info.versionInfo.version)

  // Silent and force re-open after update
  if (process.env.NODE_ENV !== 'development') {
    // autoUpdater.quitAndInstall()
  }
})

function AnnounceUpdate(version) {
  if (UpdateOptions.dialogShow) {
    return
  }
  UpdateOptions.dialogShow = true
  const options = {
    type: 'question',
    buttons: ['Update now', 'Update after closing'],
    defaultId: 1,
    title: 'Internxt Drive',
    message: 'New update available: ' + version
  }
  dialog.showMessageBox(new BrowserWindow({
    show: false,
    parent: mainWindow,
    alwaysOnTop: true
  }), options, (userResponse) => {
    UpdateOptions.dialogShow = false
    if (userResponse === 0) {
      autoUpdater.quitAndInstall(false, true)
    }
  })
}

const UpdateOptions = {
  doNotAskAgain: false,
  dialogShow: false
}

function SuggestUpdate(version, downloadUrl) {
  if (UpdateOptions.dialogShow) {
    return
  }
  UpdateOptions.dialogShow = true
  const options = {
    type: 'question',
    buttons: ['Download update', 'Ignore'],
    defaultId: 1,
    title: 'Internxt Drive',
    message: 'New Internxt Drive update available: ' + version
  }

  dialog.showMessageBox(new BrowserWindow({
    show: false,
    parent: mainWindow,
    alwaysOnTop: true
  }), options, (userResponse) => {
    UpdateOptions.dialogShow = false
    if (userResponse === 0) {
      shell.openExternal(downloadUrl)
    } else {
      UpdateOptions.doNotAskAgain = true
    }
  })
}

function GetAppPlatform() {
  if (process.platform === 'win32') {
    return 'win32'
  }

  if (process.platform === 'linux') {
    return process.env.APPIMAGE ? 'linux-AppImage' : 'linux-deb'
  }

  return process.platform
}

function checkUpdates() {
  if (UpdateOptions.doNotAskAgain) {
    return
  }

  // Get current platform to decide update method
  const platform = GetAppPlatform()

  // DEB package doesn't support autoupdate. So let's check updates manually.
  if (platform === 'linux-deb' || platform === 'darwin') {
    return ManualCheckUpdate()
  }

  autoUpdater.checkForUpdates().then((UpdateCheckResult) => {
    if (process.env.NODE_ENV !== 'development') {
      // autoUpdater.updateInfoAndProvider = UpdateCheckResult
    }
  }).catch(err => {
    console.log('Error checking updates: %s', err.message)
  })
}

async function ManualCheckUpdate() {
  fetch('https://api.github.com/repos/internxt/drive-desktop/releases/latest')
    .then(res => res.json())
    .then(res => {
      const currentVersion = semver.valid(PackageJson.version)
      const latestVersion = semver.valid(res.tag_name)

      if (semver.gt(latestVersion, currentVersion)) {
        console.log('New versión %s is available', latestVersion)
        const currentPlatform = GetAppPlatform()

        let result
        if (currentPlatform === 'linux-deb') {
          result = res.assets.filter(value => value.name.endsWith('.deb'))
        }
        if (currentPlatform === 'darwin') {
          result = res.assets.filter(value => value.name.endsWith('.dmg'))
        }

        if (result && result.length === 1) {
          console.log('Update url available: %s', JSON.stringify(result[0].browser_download_url))
          return SuggestUpdate(latestVersion, result[0].browser_download_url)
        } else {
          return console.log('Cannot find %s file for update %s', currentPlatform === 'darwin' ? 'DMG' : 'DEB', latestVersion)
        }
      } else {
        console.log('Manual checking updates: no updates')
      }
    }).catch(err => {
      console.log('Manual check update error', JSON.stringify(err))
    })
}

app.on('ready', () => {
  checkUpdates()

  // Check updates every 6 hours
  setInterval(() => {
    checkUpdates()
  }, 1000 * 60 * 60 * 6)
})
