import { Storage } from '@internxt/sdk/dist/drive';
import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import Logger from 'electron-log';
import { appInfo } from '../app-info/app-info';
import { onUserUnauthorized } from '../auth/handlers';
import { obtainToken } from '../auth/service';
import { Usage } from './usage';
const driveUrl = process.env.API_URL;
const photosUrl = process.env.PHOTOS_URL;

const INFINITE_SPACE_TRHESHOLD = 108851651149824 as const;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552 as const;

const { name: clientName, version: clientVersion } = appInfo;

async function getPhotosUsage(): Promise<number> {
  if (!photosUrl) {
    throw new Error('PHOTOS API URL NOT DEFINED');
  }

  try {
    const accessToken = obtainToken('newToken');

    const photosSubmodule = new PhotosSubmodule({
      baseUrl: photosUrl,
      accessToken,
    });

    const { usage } = await photosSubmodule.getUsage();

    return usage;
  } catch (error: any) {
    Logger.warn(
      'User is missing new access token, photos usage will not be counted'
    );
  }

  return 0;
}

async function getDriveUsage(): Promise<number> {
  const storage = Storage.client(
    driveUrl,
    { clientName, clientVersion },
    {
      token: obtainToken('bearerToken'),
      unauthorizedCallback: onUserUnauthorized,
    }
  );
  const usage = await storage.spaceUsage();

  return usage.total;
}

async function getLimit(): Promise<number> {
  const storage = Storage.client(
    driveUrl,
    { clientName, clientVersion },
    {
      token: obtainToken('bearerToken'),
      unauthorizedCallback: onUserUnauthorized,
    }
  );
  const { maxSpaceBytes } = await storage.spaceLimit();

  return maxSpaceBytes;
}

export async function calculateUsage(): Promise<Usage> {
  const [driveUsage, photosUsage, limitInBytes] = await Promise.all([
    getDriveUsage(),
    getPhotosUsage(),
    getLimit(),
  ]);

  return {
    usageInBytes: driveUsage + photosUsage,
    limitInBytes,
    isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
    offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
  };
}
