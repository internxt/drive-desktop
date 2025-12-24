import { FolderDto } from './../../../infra/drive-server/out/dto';

export const allowedPlatforms = ['win32', 'darwin', 'linux', 'android'] as const;
export type AllowedPlatform = (typeof allowedPlatforms)[number];

export type DeviceIdentifierDTO = {
  key: string;
  platform: AllowedPlatform;
  hostname: string;
};

export type ExistingDeviceIdentifierDTO = DeviceIdentifierDTO & {
  uuid: string;
};

export function isAllowedPlatform(platform: string): platform is AllowedPlatform {
  return (allowedPlatforms as readonly string[]).includes(platform);
}

export type FolderDtoWithPathname = FolderDto & {
  pathname: string;
};
