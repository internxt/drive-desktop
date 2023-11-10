import fs from 'fs';
import os from 'os';

import packageJson from '../../../../package.json';

const fileName = `${packageJson.name}.desktop`;
const desktopFilePath = `${os.homedir()}/.config/autostart`;
const desktopFile = `${desktopFilePath}/${fileName}`;

function createDesktopEntry() {
  const fileContent = `[Desktop Entry]
  Type=Application
  Version=${packageJson.version}
  Name=${packageJson.name}
  Comment=${packageJson.name} startup script
  Exec=${packageJson.name} --process-start-args --hidden
  StartupNotify=false
  Terminal=false
  `;

  if (!fs.existsSync(desktopFilePath)) {
    fs.mkdirSync(desktopFilePath);
  }

  fs.writeFileSync(desktopFile, fileContent);
}

function deleteDesktopEntry() {
  fs.unlinkSync(desktopFile);
}

export function desktopEntryIsPresent(): boolean {
  return fs.existsSync(desktopFile);
}

export function toggleDesktopEntry() {
  if (desktopEntryIsPresent()) {
    deleteDesktopEntry();

    return;
  }
  createDesktopEntry();
}
