import fileExtensionGroups, { FileExtensionGroup } from '../../../shared/FileTypes/FileTypes';

const imageExtensions = fileExtensionGroups[FileExtensionGroup.Image];
const pdfExtensions = fileExtensionGroups[FileExtensionGroup.Pdf];

const thumbnableImageExtension = [
  ...imageExtensions.jpg,
  ...imageExtensions.png,
  ...imageExtensions.bmp,
  ...imageExtensions.gif,
] as const;

const thumbnablePdfExtension = [...pdfExtensions.pdf] as const;

export const thumbnableExtensions = [...thumbnableImageExtension, ...thumbnablePdfExtension] as const;
