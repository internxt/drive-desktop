import { promises as fs } from 'fs';
import path from 'path';
import { CleanableItem } from '../../cleaner.types';
import { scanDirectory } from '../../scan-directory';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';

/**
 * Filter for Firefox storage files - only include SQLite database files
 * Returns true to skip file, false to include file
 */
function firefoxStorageFileFilter(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();

  // Only include SQLite database files used for storage
  const storageExtensions = ['.sqlite', '.sqlite3', '.db'];
  const isStorageFile = storageExtensions.some((ext) =>
    lowerName.endsWith(ext)
  );

  // Also include specific Firefox storage files without extensions (rare but possible)
  const storageFileNames = ['cookies', 'webappsstore', 'chromeappsstore'];
  const isStorageFileName = storageFileNames.some((name) =>
    lowerName.includes(name)
  );

  // Skip files that are not storage-related
  return !(isStorageFile || isStorageFileName);
}

/**
 * Scans Firefox profiles for storage files (cookies and local storage).
 *
 * Firefox uses a different storage architecture than Chrome/Brave:
 * - Firefox stores data in dynamically named profile directories (e.g., "rwt14re6.default")
 * - Storage data is consolidated into SQLite database files instead of separate directories
 * - cookies.sqlite: Contains all browser cookies
 * - webappsstore.sqlite: Contains DOM/local storage data
 *
 * This function discovers all Firefox profiles and scans their storage files.
 */
export async function scanFirefoxProfiles(
  firefoxProfilesDir: string
): Promise<CleanableItem[]> {
  const items: CleanableItem[] = [];

  try {
    const entries = await fs.readdir(firefoxProfilesDir);

    // Filter for actual profile directories
    const profileDirsChecks = await Promise.allSettled(
      entries.map(async (entry) => {
        const isProfileDir = await isFirefoxProfileDirectory(
          entry,
          firefoxProfilesDir
        );
        return { entry, isProfileDir };
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
      const profilePath = path.join(firefoxProfilesDir, profileDir);

      // Scan entire profile directory with storage file filter
      scanPromises.push(
        scanDirectory({
          dirPath: profilePath,
          customFileFilter: firefoxStorageFileFilter,
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
     * Silently ignore errors when scanning Firefox profiles
     * This handles cases where profiles don't exist or are inaccessible
     */
  }

  return items;
}
