import { logger } from '@internxt/drive-desktop-core/build/backend';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

import packageJson from '../../../package.json';

const fileName = `${packageJson.name}.desktop`;
const desktopFilePath = `${homedir()}/.config/autostart`;
const desktopFile = `${desktopFilePath}/${fileName}`;
const execPath = process.execPath;

export async function createDesktopEntry() {
  const fileContent = `[Desktop Entry]
  Type=Application
  Version=${packageJson.version}
  Name=${packageJson.name}
  Comment=${packageJson.name} startup script
  Exec="${execPath}" --process-start-args --hidden
  StartupNotify=false
  Terminal=false
  `;

  try {
    await mkdir(desktopFilePath, { recursive: true });
    await writeFile(desktopFile, fileContent, { mode: 0o755 });
  } catch (err) {
    logger.error({ msg: 'Error creating desktop entry for auto-launch:', err });
  }
}

export async function deleteDesktopEntry() {
  if (existsSync(desktopFile)) {
    try {
      await unlink(desktopFile);
    } catch (err) {
      logger.error({ msg: 'Error deleting desktop entry for auto-launch:', err });
    }
  }
}

export function desktopEntryIsPresent(): boolean {
  return existsSync(desktopFile);
}

export async function toggleDesktopEntry() {
  if (desktopEntryIsPresent()) {
    await deleteDesktopEntry();
    return;
  }
  await createDesktopEntry();
}
