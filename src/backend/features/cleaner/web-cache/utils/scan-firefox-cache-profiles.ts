import { promises as fs } from 'fs';
import path from 'path';
import { CleanableItem } from '../../cleaner.types';
import { scanDirectory } from '../../scan-directory';
import { webBrowserFileFilter } from '../../utils/is-safe-web-browser-file';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';

/**
 * Scans Firefox cache profiles for cache files.
 *
 * Firefox cache architecture:
 * - Cache is organized by profile directories (e.g., "rwt14re6.default")
 * - Each profile has a cache2/ directory containing the actual cache files
 * - Cache files include HTTP cache, thumbnails, startup cache, etc.
 *
 * This function discovers all Firefox profiles and scans their cache directories.
 */
export async function scanFirefoxCacheProfiles(
  firefoxCacheDir: string
): Promise<CleanableItem[]> {
  const items: CleanableItem[] = [];

  try {
    const entries = await fs.readdir(firefoxCacheDir);

    // Filter for actual profile directories (contain a dot, exclude system folders)
    const profileDirsChecks = await Promise.allSettled(
      entries.map(async (entry) => {
        const isProfileDir = await isFirefoxProfileDirectory(
          entry,
          firefoxCacheDir
        );
        return { entry: entry, isProfileDir };
      })
    );

    const profileDirs = profileDirsChecks
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<{
          entry: string;
          isProfileDir: boolean;
        }> => result.status === 'fulfilled' && result.value.isProfileDir
      )
      .map((result) => result.value.entry);

    const scanPromises: Promise<CleanableItem[]>[] = [];

    for (const profileDir of profileDirs) {
      const profileCachePath = path.join(firefoxCacheDir, profileDir);

      // Scan cache2/ directory (main HTTP cache)
      const cache2Path = path.join(profileCachePath, 'cache2');
      scanPromises.push(
        scanDirectory({
          dirPath: cache2Path,
          customFileFilter: webBrowserFileFilter,
        })
      );

      // Scan thumbnails cache
      const thumbnailsPath = path.join(profileCachePath, 'thumbnails');
      scanPromises.push(
        scanDirectory({
          dirPath: thumbnailsPath,
          customFileFilter: webBrowserFileFilter,
        })
      );

      // Scan startup cache
      const startupCachePath = path.join(profileCachePath, 'startupCache');
      scanPromises.push(
        scanDirectory({
          dirPath: startupCachePath,
          customFileFilter: webBrowserFileFilter,
        })
      );
    }

    const results = await Promise.allSettled(scanPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    });
  } catch (error) {
    /**
     * v.2.5.0
     * Alexis Mora
     * Silently ignore errors when scanning Firefox cache profiles
     * This handles cases where profiles don't exist or are inaccessible
     */
  }

  return items;
}
