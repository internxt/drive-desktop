import { Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path/posix';

import { scanDirectory } from '../../scan/scan-directory';
import { CleanableItem, CleanerContext } from '../../types/cleaner.types';
import { isFirefoxProfileDirectory } from '../../utils/is-firefox-profile-directory';
import { isSafeWebBrowserFile } from '../../utils/is-safe-web-browser-file';

type Props = {
  ctx: CleanerContext;
  firefoxProfilesDir: string;
};

export async function scanFirefoxProfiles({ ctx, firefoxProfilesDir }: Props) {
  let entries: Dirent[];
  try {
    entries = await readdir(firefoxProfilesDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const profileDirsChecks = entries.map((entry) => {
    const isProfileDir = isFirefoxProfileDirectory({ entry, parentPath: firefoxProfilesDir });
    return { entry, isProfileDir };
  });

  const profileDirs = profileDirsChecks.filter((result) => result.isProfileDir).map((result) => result.entry.name);

  const scanPromises: Promise<CleanableItem[]>[] = [];

  for (const profileDir of profileDirs) {
    const profilePath = join(firefoxProfilesDir, profileDir);

    scanPromises.push(
      scanDirectory({
        ctx,
        dirPath: profilePath,
        customFileFilter: isSafeWebBrowserFile,
      }),
    );
  }

  const results = await Promise.allSettled(scanPromises);
  return results.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value);
}
