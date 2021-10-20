import fs from 'fs/promises'

export async function getModTimeInSeconds(localPath: string): Promise<number> {
	const stat = await fs.stat(localPath)
	return Math.trunc(stat.mtimeMs / 1000)
}

export function getDateFromSeconds(seconds: number): Date {
	return new Date(seconds * 1000)
}

export function getSecondsFromDateString(dateString: string): number {
	return Math.trunc(new Date(dateString).valueOf() / 1000)
}