'use strict'

require('dotenv').config()

const { notarize } = require('electron-notarize')

exports.default = async function notarizing (context) {
  console.log('Notarizing...')
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    return
  }

  const appName = context.packager.appInfo.productFilename

  var result = await notarize({
    appBundleId: 'com.internxt.xclouddesktop',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS
  })

  return result
}
