import fileExtensionGroups, {
  FileExtensionGroup,
} from '../../../shared/FileTypes/FileTypes';

const imageExtensions = fileExtensionGroups[FileExtensionGroup.Image];
const pdfExtensions = fileExtensionGroups[FileExtensionGroup.Pdf];

const thumbnableImageExtension = [
  ...imageExtensions.jpg,
  ...imageExtensions.png,
  ...imageExtensions.bmp,
  ...imageExtensions.gif,
] as const;

const thumbnablePdfExtension = [...pdfExtensions.pdf] as const;

export const thumbnableExtensions = [
  ...thumbnableImageExtension,
  ...thumbnablePdfExtension,
] as const;

export type ImageThumbnailable = (typeof thumbnableImageExtension)[number];
export type PDFThumbnailableExtension = (typeof thumbnablePdfExtension)[number];
export type ThumbnailableExtension =
  | ImageThumbnailable
  | PDFThumbnailableExtension;

export function isThumbnailableExtension(extension: string): boolean {
  return thumbnableExtensions.includes(extension);
}

export function isImageThumbnailable(extension: string): boolean {
  return thumbnableImageExtension.includes(extension);
}

export function isPdfThumbnailable(extension: string): boolean {
  return thumbnablePdfExtension.includes(extension);
}
