const thumbnailableImageExtension = ['bmp', 'jpg', 'jpeg', 'gif', 'png'];

export function isImageThumbnailable(extension: string): boolean {
  return thumbnailableImageExtension.includes(extension);
}
