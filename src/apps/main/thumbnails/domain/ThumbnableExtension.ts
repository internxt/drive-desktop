import fileExtensionGroups, { FileExtensionGroup } from '../../../shared/FileTypes/FileTypes';

const imageExtensions = fileExtensionGroups[FileExtensionGroup.Image];

const thumbnailableImageExtension = [
  ...imageExtensions.jpg,
  ...imageExtensions.png,
  ...imageExtensions.bmp,
  ...imageExtensions.gif,
] as const;

export function isImageThumbnailable(extension: string): boolean {
  return thumbnailableImageExtension.includes(extension);
}
