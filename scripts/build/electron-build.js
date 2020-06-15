const builder = require('electron-builder')
const Platform = builder.Platform

const programPlatforms = {
  MAC: { name: 'mac', config: './config/mac.json', platform: Platform.MAC },
  WINDOWS: { name: 'win', config: './config/windows.json', platform: Platform.WINDOWS },
  LINUX: { name: 'linux', config: './config/linux.json', platform: Platform.LINUX }
}

function getElectronPlatform(nodePlatform) {
  let electronPlatform
  if (!nodePlatform) {
    return electronPlatform
  }

  switch (nodePlatform) {
    case 'darwin':
      electronPlatform = programPlatforms.MAC
      break
    case 'linux':
      electronPlatform = programPlatforms.LINUX
      break
    case 'win32':
      electronPlatform = programPlatforms.WINDOWS
  }

  return electronPlatform
}

const currentPlatform = getElectronPlatform(process.platform)

if (!currentPlatform) {
  console.error('Your current platform is not supported for building this electron app')
  process.exit()
}

const buildConfig = require(currentPlatform.config)

console.log(`Building electron app for ${currentPlatform.name} with config ${currentPlatform.config}`)

// Promise is returned
builder.build({
  targets: currentPlatform.platform.createTarget(),
  config: buildConfig
})
  .then(() => {
    console.log(`Electron App for ${currentPlatform.name} with config ${currentPlatform.config} was succesfull build !!!`)
  })
  .catch((error) => {
    console.error(`Error building electron application: ${error}`)
  })
