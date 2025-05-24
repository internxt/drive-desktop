import Loki from 'lokijs';
import path from 'path';
import { app } from 'electron'; // Only if using Electron
import { DriveFile, DriveFileSchema } from './drive-file';

// Define DB location (adjust if not in Electron)
const dbFilePath = path.join(process.cwd(), 'drive-files.db');

// Initialize LokiJS DB
const db = new Loki(dbFilePath, {
  autoload: true,
  autosave: true,
  autosaveInterval: 5000,
  autoloadCallback: initCollection,
});

let driveFiles: Collection<DriveFile>;

function initCollection() {
  driveFiles = db.getCollection<DriveFile>('drive_files');
  if (!driveFiles) {
    driveFiles = db.addCollection<DriveFile>('drive_files', {
      unique: ['uuid'],
    });
  }
}

// Upsert function
export function upsertDriveFile(data: unknown): DriveFile {
  const parsed = DriveFileSchema.parse(data);

  const existing = driveFiles.by('uuid', parsed.uuid);
  if (existing) {
    Object.assign(existing, parsed);
    driveFiles.update(existing);
    return existing;
  } else {
    return driveFiles.insert(parsed);
  }
}

// Optional: query function
export function getDriveFileByUUID(uuid: string): DriveFile | null {
  return driveFiles.by('uuid', uuid) ?? null;
}

export function setDriveFileCollection(collection: Collection<DriveFile>) {
  driveFiles = collection;
}
