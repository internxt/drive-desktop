export const PERSONAL_DRIVE_SUBFOLDER = 'Personal Drive';

const INVALID_CHARACTERS = String.raw`<>:"/\|?*`;
const RESERVED_NAMES = /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i;
const MAX_NAME_LENGTH = 255;

type Workspace = {
  id: string;
  name: string;
};

/**
 * v2.7.2 Alexis Mora
 * Returns the subfolder of every context keyed by workspaceId, with '' for the personal Drive.
 * Without workspaces the personal Drive is the only context, so its items go straight into the dated folder.
 * Workspaces are sorted by id so a resumed run gives every workspace the same subfolder as before,
 * and names are made unique ignoring case because Windows does.
 */
export function getRecoverySubfolders({ workspaces }: { workspaces: Workspace[] }) {
  if (workspaces.length === 0) return new Map([['', '']]);

  const subfolders = new Map([['', PERSONAL_DRIVE_SUBFOLDER]]);
  const used = new Set([PERSONAL_DRIVE_SUBFOLDER.toLowerCase()]);
  const sorted = workspaces.toSorted((a, b) => a.id.localeCompare(b.id));

  for (const { id, name } of sorted) {
    const base = toFolderName({ name }) || id;
    let attempt = 1;
    let subfolder = withSuffix({ base, attempt });

    while (used.has(subfolder.toLowerCase())) {
      attempt++;
      subfolder = withSuffix({ base, attempt });
    }

    used.add(subfolder.toLowerCase());
    subfolders.set(id, subfolder);
  }

  return subfolders;
}

/**
 * v2.7.2 Alexis Mora
 * Workspace names come from users, so characters and names Windows rejects in folder names are replaced,
 * and trailing dots and spaces are removed because Windows drops them silently.
 */
function toFolderName({ name }: { name: string }) {
  const replaced = [...name].map((char) => (char < ' ' || INVALID_CHARACTERS.includes(char) ? '_' : char)).join('');
  const trimmed = replaced.trim().replace(/[. ]+$/, '');
  return RESERVED_NAMES.test(trimmed) ? `_${trimmed}` : trimmed;
}

/**
 * v2.7.2 Alexis Mora
 * Windows rejects folder names longer than 255 characters, so the base is shortened to leave room for the suffix.
 * The cut must not leave half of a surrogate pair, or the trailing dots and spaces Windows drops.
 */
function withSuffix({ base, attempt }: { base: string; attempt: number }) {
  const suffix = attempt === 1 ? '' : ` (${attempt})`;
  const shortened = base
    .slice(0, MAX_NAME_LENGTH - suffix.length)
    .replace(/[\uD800-\uDBFF]$/, '')
    .replace(/[. ]+$/, '');
  return `${shortened}${suffix}`;
}
