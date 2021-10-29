import fs from 'fs/promises'

export async function getLocalMeta(
  localPath: string
): Promise<{ modTimeInSeconds: number; size: number }> {
  const stat = await fs.stat(localPath)
  return { modTimeInSeconds: Math.trunc(stat.mtimeMs / 1000), size: stat.size }
}

export function getDateFromSeconds(seconds: number): Date {
  return new Date(seconds * 1000)
}

export function getSecondsFromDateString(dateString: string): number {
  return Math.trunc(new Date(dateString).valueOf() / 1000)
}
