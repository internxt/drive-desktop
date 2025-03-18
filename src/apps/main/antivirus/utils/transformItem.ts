import { createHash, randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { extname } from 'path';
import { ScannedItem } from '../../database/entities/ScannedItem';
import { pipeline } from 'stream/promises';

const hashItem = async (filePath: string): Promise<string> => {
  try {
    const hasher = createHash('sha256');
    const stream = createReadStream(filePath);

    await pipeline(stream, hasher);
    return hasher.digest('hex');
  } catch (error) {
    console.log(`ERROR HASHING ITEM ${error}`);
    throw error;
  }
};

export const transformItem = async (fullPath: string): Promise<ScannedItem> => {
  const stats = await stat(fullPath);
  const fileHash = await hashItem(fullPath);

  const currentTime = new Date().toISOString();

  const scannedItem: ScannedItem = {
    id: randomUUID(),
    type: extname(fullPath).toLowerCase(),
    size: stats.size,
    hash: fileHash,
    createdAt: currentTime,
    updatedAt: currentTime,
    creationTimeW: stats.ctime.toISOString(),
    updatedAtW: stats.mtime.toISOString(),
    pathName: fullPath,
    status: 'scanned',
    isInfected: false,
  };

  return scannedItem;
};
