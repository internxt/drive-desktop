import { promises as fs } from 'fs';
import path from 'path';

/**
 * Check if entry is a Firefox profile directory.
 * 
 * Firefox profile directories have specific characteristics:
 * - They are directories (not files)
 * - They contain a dot in their name (e.g., "rwt14re6.default")
 * - This distinguishes them from system folders like "Crash Reports", "Pending Pings", etc.
 */
export async function isFirefoxProfileDirectory(entry: string, parentPath: string): Promise<boolean> {
  const fullPath = path.join(parentPath, entry);
  try {
    const stat = await fs.stat(fullPath);
    return stat.isDirectory() && entry.includes('.');
  } catch {
    return false;
  }
}