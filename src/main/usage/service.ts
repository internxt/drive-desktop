import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import Logger from 'electron-log';
import fetch, { HeadersInit } from 'electron-fetch';
import { getHeaders, getNewToken } from '../auth/service';
import { Usage } from './usage';

const driveUrl = process.env.API_URL;
const photosUrl = process.env.PHOTOS_URL;

let photosSubmodule: PhotosSubmodule | null = null;

function sataticPhotosSubmodule(): PhotosSubmodule {
  if (photosSubmodule) return photosSubmodule;

  if (!photosUrl) {
    throw new Error('PHOTOS API URL NOT DEFINED');
  }

  photosSubmodule = new PhotosSubmodule({
    baseUrl: photosUrl,
    accessToken: getNewToken(),
  });

  return photosSubmodule;
}

async function getPhotosUsage(): Promise<number> {
  const { usage } = await sataticPhotosSubmodule().getUsage();

  return usage;
}

async function getDriveUsage(headers: HeadersInit): Promise<number> {
  const response = await fetch(`${driveUrl}/api/usage`, {
    headers,
  });

  if (!response.ok) {
    Logger.error('Usage request failed');
  }

  const body = await response.json();

  return body.total || 0;
}

async function getLimit(headers: HeadersInit): Promise<number> {
  const response = await fetch(`${driveUrl}/api/limit`, {
    headers,
  });

  if (!response.ok) {
    Logger.error('Limit request failed');
  }

  const body = await response.json();

  return body.maxSpaceBytes as number;
}

export async function calculateUsage(): Promise<Usage> {
  const headers = getHeaders();
  const [driveUsage, photosUsage, limitInBytes] = await Promise.all([
    getDriveUsage(headers),
    getPhotosUsage(),
    getLimit(headers),
  ]);

  return {
    usageInBytes: driveUsage + photosUsage,
    limitInBytes,
    isInfinite: limitInBytes >= 108851651149824,
    offerUpgrade: limitInBytes < 2199023255552,
  };
}
