import fileExtensionGroups, { FileExtensionGroup } from '../../../shared/FileTypes/FileTypes';

const imageExtensions = fileExtensionGroups[FileExtensionGroup.Image];
const pdfExtensions = fileExtensionGroups[FileExtensionGroup.Pdf];

const thumbnailableImageExtension = [
	...imageExtensions.jpg,
	...imageExtensions.png,
	...imageExtensions.bmp,
	...imageExtensions.gif,
] as const;

const thumbnailablePdfExtension = [...pdfExtensions.pdf] as const;

const thumbnailableExtension = [
	...thumbnailableImageExtension,
	...thumbnailablePdfExtension,
] as const;

export type ImageThumbnailable = (typeof thumbnailableImageExtension)[number];
export type PDFThumbnailableExtension = (typeof thumbnailablePdfExtension)[number];
export type ThumbnailableExtension = ImageThumbnailable | PDFThumbnailableExtension;

export function isThumbnailableExtension(extension: string): boolean {
	return thumbnailableExtension.includes(extension);
}

export function isImageThumbnailable(extension: string): boolean {
	return thumbnailableImageExtension.includes(extension);
}

export function isPdfThumbnailable(extension: string): boolean {
	return thumbnailablePdfExtension.includes(extension);
}
