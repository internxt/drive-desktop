'use strict'

require('dotenv').config()

const { notarize } = require('electron-notarize')

exports.default = async function notarizing (context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    console.log('Notarize not needed. Skipped.')
    return
  } else {
    console.log('Notarizing...')
    return
  }

  const appName = context.packager.appInfo.productFilename

  const result = await notarize({
    appBundleId: 'com.internxt.drive',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS
  })

  return result
}
