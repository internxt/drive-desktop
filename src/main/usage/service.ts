import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import Logger from 'electron-log';
import { getClient } from '../../shared/HttpClient/main-process-client';

import { obtainToken } from '../auth/service';
import { Usage } from './usage';

const driveUrl = process.env.API_URL;
const photosUrl = process.env.PHOTOS_URL;

const httpClient = getClient();

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
  const r = await httpClient.get(`${driveUrl}/api/usage`);

  if (r.status !== 200) {
    Logger.error('Drive usage request failed');
    throw new Error(
      `Drive usage request failed with ${r.status} ${r.statusText}`
    );
  }

  return r.data.total || 0;
}

async function getLimit(): Promise<number> {
  const response = await httpClient.get(`${driveUrl}/api/limit`);

  if (response.status !== 200) {
    Logger.error('Limit request failed');
    throw new Error(
      `Limit request failed with ${response.status} ${response.statusText}`
    );
  }

  return response.data.maxSpaceBytes as number;
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
    isInfinite: limitInBytes >= 108851651149824,
    offerUpgrade: limitInBytes < 2199023255552,
  };
}
