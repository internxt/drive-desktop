import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import fetch, { HeadersInit } from 'electron-fetch';
import Logger from 'electron-log';

import { getHeaders, obtainToken } from '../auth/service';
import { Usage } from './usage';

const driveUrl = process.env.API_URL;
const photosUrl = process.env.PHOTOS_URL;

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
		Logger.warn('User is missing new access token, photos usage will not be counted');
	}

	return 0;
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
