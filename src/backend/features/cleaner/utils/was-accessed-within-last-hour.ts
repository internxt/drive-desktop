import { promises as fs } from 'fs';

/**
 * Get the most recent access or modification time for a file
 * @param filePath Path to the file
 * @returns Promise<Date> The most recent access or modification time
 */
async function getLastAccessTime(filePath: string): Promise<Date> {
  const stat = await fs.stat(filePath);
  return new Date(Math.max(stat.atime.getTime(), stat.mtime.getTime()));
}

/**
 * Check if a file was accessed within the last hour (cleaner threshold)
 * @param filePath Path to the file
 * @returns Promise<boolean> True if accessed within 1 hour, false otherwise
 */
export async function wasAccessedWithinLastHour(filePath: string): Promise<boolean> {
  try {
    const lastAccessTime = await getLastAccessTime(filePath);
    const hoursSinceAccess = (Date.now() - lastAccessTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceAccess <= 1;
  } catch {
    return true;
  }
}
