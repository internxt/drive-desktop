export interface ThumbnailUploader {
  upload: (fileId: number, thumbnailFile: Buffer) => Promise<void>;
}
