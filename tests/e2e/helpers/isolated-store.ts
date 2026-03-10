import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export function createIsolatedStore(): { dir: { homeDir: string; appDir: string }; cleanup: () => void } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'internxt-e2e-'));
  const homeDir = path.join(dir, 'home');
  const appDir = path.join(dir, 'app');
  fs.mkdirSync(homeDir);
  fs.mkdirSync(appDir);
  return {
    dir: { homeDir, appDir },
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  };
}
