'use strict'

import electron, {
  app,
  BrowserWindow,
  Menu,
  shell,
  dialog,
  powerMonitor,
  ipcMain
} from 'electron'
import path from 'path'
import Logger from '../libs/logger'
import AutoLaunch from '../libs/autolauncher'
import { autoUpdater } from 'electron-updater'
import semver from 'semver'
import PackageJson from '../../package.json'
import fetch from 'electron-fetch'
import ConfigStore from './config-store'
import TrayMenu from './traymenu'
import FileLogger from '../renderer/logic/FileLogger'
import dimentions from './window-dimentions/dimentions'
import BackupsDB from '../backup-process/backups-db'
import { debounce } from 'lodash'

require('@electron/remote/main').initialize()
AutoLaunch.configureAutostart()
var lock = false
let isOnboarding = false
let isLogin = false
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, trayMenu

const winURL =
  process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

if (process.platform === 'darwin') {
  app.dock.hide()
}

if (!app.requestSingleInstanceLock()) {
  FileLogger.saveLog()
  app.quit()
}

function getWindowPos(trayBounds = trayMenu.tray.getBounds()) {
  const display = electron.screen.getDisplayMatching(trayBounds)
  let x = Math.min(
    trayBounds.x - display.workArea.x - dimentions['/xcloud'].width / 2,
    display.workArea.width - dimentions['/xcloud'].width
  )
  x += display.workArea.x
  x = Math.max(display.workArea.x, x)
  let y = Math.min(
    trayBounds.y - display.workArea.y - dimentions['/xcloud'].height / 2,
    display.workArea.height - dimentions['/xcloud'].height
  )
  y += display.workArea.y
  y = Math.max(display.workArea.y, y)
  return {
    x: x,
    y: y
  }
}

function getDimentions(route) {
  if (route === '/xcloud') {
    return Object.assign(dimentions[route], getWindowPos())
  } else {
    return dimentions[route]
  }
}

function createWindow() {
  trayMenu = new TrayMenu(mainWindow)
  trayMenu.init()
  trayMenu.setToolTip('Internxt Drive ' + PackageJson.version) // Tray tooltip

  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: process.env.NODE_ENV !== 'development',
      enableRemoteModule: true,
      devTools: process.env.NODE_ENV === 'development'
    },
    movable: false,
    frame: false,
    resizable: false,
    width: dimentions['/xcloud'].width,
    height: dimentions['/xcloud'].height,
    useContentSize: true,
    maximizable: false, // this won't work on linux
    autoHideMenuBar: false,
    skipTaskbar: process.env.NODE_ENV !== 'development',
    show: true,
    menuBarVisible: false,
    centered: true
  })

  mainWindow.loadURL(winURL).then(() => {
    mainWindow.webContents.send('tray-position', { x: 1, y: 1 })
  })

  mainWindow.on('closed', appClose)
  mainWindow.on('close', appClose)

  mainWindow.on('blur', () => {
    if (!isLogin && !isOnboarding) mainWindow.hide()
  })

  app.on('app-close', appClose)

  app.on('enter-onboarding', setIsOnboarding => {
    isOnboarding = setIsOnboarding
  })
  app.on('enter-login', setIsLogin => {
    isLogin = setIsLogin
  })

  app.on('user-logout', () => {
    FileLogger.eraseLog()
    if (settingsWindow) settingsWindow.destroy()
  })

  app.on('update-configStore', item => {
    const [key, value] = Object.entries(item)[0]
    ConfigStore.set(key, value)
  })

  app.on('window-pushed-to', route => {
    // changing windowDimentions accordingly
    mainWindow.setBounds(getDimentions(route))
    if (route !== '/xcloud') {
      mainWindow.center()
    }
  })

  const edit = {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: function() {
          self.getWindow().webContents.undo()
        }
      },
      {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Y',
        click: function() {
          self.getWindow().webContents.redo()
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        click: function() {
          self.getWindow().webContents.cut()
        }
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        click: function() {
          self.getWindow().webContents.copy()
        }
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        click: function() {
          self.getWindow().webContents.paste()
        }
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        click: function() {
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

  const windowMenu = Menu.setApplicationMenu(
    Menu.buildFromTemplate([process.platform === 'darwin' ? editMacOS : edit])
  )
}

app.on('ready', () => {
  createWindow()
})

app.on('show-main-windows', showMainWindows)

function showMainWindows(trayBounds) {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.setBounds(getWindowPos(trayBounds))
    mainWindow.show()
  }
}

async function appClose() {
  let attempts = 5
  while (ConfigStore.get('updatingDB') && attempts > 0) {
    attempts--
    await new Promise(resolve => {
      setTimeout(resolve, 1000)
    })
  }
  if (ConfigStore.get('isSyncing')) {
    await new Promise(resolve => {
      setTimeout(resolve, 1000)
    })
  }
  if (mainWindow) {
    mainWindow.destroy()
  }
  if (trayMenu) {
    trayMenu.destroy()
    trayMenu = null
  }
  FileLogger.saveLog()
  app.quit()
}

app.on('window-all-closed', () => {
  appClose()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', function(evt) {
  if (trayMenu) {
    trayMenu.destroy()
  }
})

app.on('sync-on', function() {
  trayMenu.setIsLoadingIcon(true)
})

app.on('sync-off', function() {
  trayMenu.setIsLoadingIcon(false)
})

app.on('change-auto-launch', AutoLaunch.configureAutostart)

function maybeShowWindow() {
  if (mainWindow) {
    mainWindow.show()
  } else {
    app.on('window-show', function() {
      if (mainWindow) {
        mainWindow.show()
      }
    })
  }
}

maybeShowWindow()

app.on('show-bubble', (title, content) => {
  if (trayMenu) {
    trayMenu.displayBallon(title, content)
  }
})

app.on('window-hide', function() {
  if (mainWindow) {
    if (process.env.NODE_ENV !== 'development') {
      mainWindow.hide()
    }
  }
})

app.on('set-tooltip', msg => {
  const message = `Internxt Drive ${PackageJson.version}${
    msg ? '\n' + msg : ''
  }`
  trayMenu.setToolTip(message)
})

app.on('show-error', msg => {
  dialog.showErrorBox('Error', msg)
})
app.on('show-info', (msg, title) => {
  dialog.showMessageBox({
    message: msg,
    type: 'info',
    title: title
  })
})

let settingsWindow = null

ipcMain.on('open-settings-window', (_, section) => {
  if (settingsWindow) {
    app.emit('settings-change-section', section)
    settingsWindow.focus()
  } else {
    const settingsPath =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:9080/#/settings?section=${section}`
        : `file://${__dirname}/index.html#settings?section=${section}`

    settingsWindow = new BrowserWindow({
      width: 500,
      height: 428,
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
      frame: process.platform !== 'darwin' ? false : undefined,
      maximizable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
      }
    })
    settingsWindow.loadURL(settingsPath)
    settingsWindow.once('closed', () => {
      settingsWindow = null
    })
    settingsWindow.once('ready-to-show', () => {
      settingsWindow.show()
    })
  }
})

ipcMain.on(
  'settings-window-resize',
  debounce((_, { height }) => resizeSettingsWindow(height), 300)
)

function resizeSettingsWindow(height) {
  if (settingsWindow) settingsWindow.setSize(500, Math.trunc(height), true)
}

app.on('close-settings-window', () => {
  if (settingsWindow) settingsWindow.close()
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
  autoUpdater.currentVersion = '1.0.0'
}

autoUpdater.on('error', err => {
  console.log('update error:', err)
})

autoUpdater.on('checking-for-update', () => {})

autoUpdater.on('update-available', () => {})

autoUpdater.on('update-not-available', () => {})

autoUpdater.on('download-progress', progress => {})

autoUpdater.on('update-downloaded', info => {
  Logger.info('New update downloaded, quit and install')
  AnnounceUpdate(info.version)

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
    buttons: ['Update now', 'Update later'],
    defaultId: 1,
    cancelId: 1,
    title: 'Internxt Drive',
    message: 'New update available: ' + version
  }
  Logger.log('Show update dialog')
  dialog
    .showMessageBox(
      new BrowserWindow({
        show: false,
        parent: mainWindow,
        alwaysOnTop: true,
        width: 400,
        height: 500,
        minWidth: 400,
        minHeight: 500,
        maxWidth: 400,
        maxHeight: 500
      }),
      options
    )
    .then(userResponse => {
      UpdateOptions.dialogShow = false
      if (userResponse.response === 0) {
        Logger.log('Update now')
        autoUpdater.quitAndInstall(false, true)
      } else {
        Logger.log('Update later')
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
    defaultId: 0,
    cancelId: 1,
    title: 'Internxt Drive',
    message: 'New Internxt Drive update available: ' + version
  }

  const userResponse = dialog.showMessageBoxSync(
    new BrowserWindow({
      show: false,
      parent: mainWindow,
      alwaysOnTop: true
    }),
    options
  )
  if (userResponse === 0) {
    shell.openExternal(downloadUrl)
  } else {
    UpdateOptions.doNotAskAgain = true
  }
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

  autoUpdater.checkForUpdates().then(UpdateCheckResult => {
    if (process.env.NODE_ENV !== 'development') {
      // autoUpdater.updateInfoAndProvider = UpdateCheckResult
    }
  })
}

async function ManualCheckUpdate() {
  fetch('https://api.github.com/repos/internxt/drive-desktop/releases/latest')
    .then(res => res.text())
    .then(text => {
      try {
        return JSON.parse(text)
      } catch (err) {
        throw new Error(err + ' error update, data: ' + text)
      }
    })
    .then(res => {
      const currentVersion = semver.valid(PackageJson.version)
      const latestVersion = semver.valid(res.tag_name)

      if (semver.gt(latestVersion, currentVersion)) {
        Logger.info('New versión %s is available', latestVersion)
        const currentPlatform = GetAppPlatform()

        let result
        if (currentPlatform === 'linux-deb') {
          result = res.assets.filter(value => value.name.endsWith('.deb'))
        }
        if (currentPlatform === 'darwin') {
          result = res.assets.filter(value => value.name.endsWith('.dmg'))
        }

        if (result && result.length === 1) {
          return SuggestUpdate(latestVersion, result[0].browser_download_url)
        } else {
          return console.log(
            'Cannot find %s file for update %s',
            currentPlatform === 'darwin' ? 'DMG' : 'DEB',
            latestVersion
          )
        }
      } else {
        Logger.info('Manual checking updates: no updates')
      }
    })
    .catch(err => {
      Logger.error('Manual check update error ' + err)
    })
}

app.on('ready', () => {
  checkUpdates()

  /*
    Don't start backup process right away
    as the load is already high on ready
  */
  setTimeout(startBackupProcess, 8000)

  // Check updates every 6 hours
  setInterval(() => {
    checkUpdates()
  }, 1000 * 60 * 60 * 12)

  powerMonitor.on('suspend', function() {
    Logger.warn('User system suspended')
    app.emit('sync-stop')
  })

  powerMonitor.on('resume', function() {
    Logger.warn('User system resumed')
    app.emit('sync-start')
  })
})

let backupProcessRunning = false
let backupProcessRerun = null

async function startBackupProcess() {
  const backupsAreEnabled = ConfigStore.get('backupsEnabled')

  if (backupsAreEnabled && !backupProcessRunning) {
    backupProcessRunning = true
    await BackupsDB.cleanErrors()
    app.emit('backup-running-update', true)

    const worker = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
      },
      show: false
    })

    worker
      .loadFile(
        process.env.NODE_ENV === 'development'
          ? '../backup-process/index.html'
          : `${path.join(__dirname, '..', 'backup-process')}/index.html`
      )
      .catch(Logger.error)

    const cleanUp = () => {
      worker.destroy()
      if (backupProcessRerun) {
        clearTimeout(backupProcessRerun)
      }
      backupProcessRerun = setTimeout(
        startBackupProcess,
        ConfigStore.get('backupInterval')
      )

      ConfigStore.set('lastBackup', new Date().valueOf())
      backupProcessRunning = false
      app.emit('backup-running-update', false)
    }

    ipcMain.once('backup-process-done', cleanUp)

    ipcMain.once('stop-backup-process', cleanUp)
  }
}

ipcMain.on('start-backup-process', startBackupProcess)

ipcMain.handle('is-backup-running', () => backupProcessRunning)

ipcMain.on('insert-backup-error', (_, error) => {
  BackupsDB.insertError(error)
})
