import { components } from './../../schemas.d';

export type CreateFileDto = components['schemas']['CreateFileDto'];
export type FileDto = components['schemas']['FileDto'];

export type FolderDto = components['schemas']['FolderDto'];

export type CreateThumbnailDto = components['schemas']['CreateThumbnailDto'];
export type ThumbnailDto = components['schemas']['ThumbnailDto'];

export type GetFolderContentDto = components['schemas']['GetFolderContentDto'];

export type UserFileSizeLimit = components['schemas']['GetFileLimitsDto']['maxUploadFileSize'];

export type CreateSharingPayload = components['schemas']['CreateSharingDto'];
export type UserNotification = components['schemas']['NotificationWithStatusDto'];
