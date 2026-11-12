import * as fs from 'original-fs';

/**
 * v2.7.2
 * Electron's `fs` treats any `*.asar` path as an archive: it reports a directory, cannot be read and stays locked.
 * If it is a cloud-only placeholder, reading it also blocks the main process until Windows cancels the hydration.
 */
export const { access, mkdir, open, readdir, rename, rm, stat } = fs.promises;
export const { createReadStream, createWriteStream } = fs;
