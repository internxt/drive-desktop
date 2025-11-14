import { Stats } from 'node:fs';

type Props = {
  fileStats: Stats;
};

export function wasAccessedWithinLastHour({ fileStats }: Props) {
  const lastAccessTime = Math.max(fileStats.atimeMs, fileStats.mtimeMs);
  const hoursSinceAccess = (Date.now() - lastAccessTime) / (1000 * 60 * 60);
  return hoursSinceAccess <= 1;
}
