import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function isNautilusAvailable() {
  const desktopEntry = await getDefaultDirectoryDesktopEntry();

  if (desktopEntry && !desktopEntryUsesNautilus({ desktopEntry })) {
    return false;
  }

  const hasNautilus = await hasNautilusBinary();
  if (!hasNautilus) {
    return false;
  }

  return true;
}

async function getDefaultDirectoryDesktopEntry() {
  try {
    const { stdout } = await execAsync('xdg-mime query default inode/directory');

    return stdout.trim().toLowerCase();
  } catch {
    return '';
  }
}

async function hasNautilusBinary() {
  try {
    await execAsync('command -v nautilus');
    return true;
  } catch {
    return false;
  }
}

function desktopEntryUsesNautilus({ desktopEntry }: { desktopEntry: string }) {
  return desktopEntry.includes('nautilus.desktop');
}
