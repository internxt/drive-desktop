import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

export function trimPlaceholderId<T extends FilePlaceholderId | FolderPlaceholderId>({ placeholderId }: { placeholderId: T }): T {
  /**
   * v2.5.5 Daniel Jiménez
   * For some reason the placeholder id can contain control characters.
   * I've seen this placeholderId in one of my files: FILE:1e9fd6ab-adbd-44c6-b37c-64b2651cf9ed\x00.
   * This replace was done 19 months ago so I assume that other control characters can appear, not only \x00.
   * The regex [\x00-\x1F\x7F-\x9F] matches:
   * - ASCII control characters (hex 00 to 1F) — e.g., \n, \r, \t, etc.
   * - Additional C1 control characters (hex 7F to 9F).
   */
  // eslint-disable-next-line no-control-regex
  return placeholderId.replace(/[\x00-\x1F\x7F-\x9F]/g, '').normalize() as T;
}
