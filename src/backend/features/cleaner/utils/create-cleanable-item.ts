import { promises as fs } from 'fs';
import path from 'path';
import { CleanableItem } from '../cleaner.types';

/**
 * Create a CleanableItem from a file path
 */
export async function createCleanableItem(filePath: string): Promise<CleanableItem> {
  const stat = await fs.stat(filePath);
  return {
    fullPath: filePath,
    fileName: path.basename(filePath),
    sizeInBytes: stat.size,
  };
}