import { DataSource } from 'typeorm';
import { DriveFile } from './entities/DriveFile';
import { DriveFolder } from './entities/DriveFolder';
import { PATHS } from '@/core/electron/paths';
import { Checkpoint } from './entities/checkpoint';

/**
 * v2.5.1 Daniel Jiménez
 * Do not delete or clear the DriveFile and DriveFolder tables since we are keeping the folder itself.
 * Otherwise we will lose the checkpoint and the current status of files and folders.
 */

export const AppDataSource = new DataSource(
  process.env.NODE_ENV === 'test'
    ? {
        type: 'sqljs',
        autoSave: false,
        logging: false,
        synchronize: true,
        entities: [DriveFile, DriveFolder, Checkpoint],
      }
    : {
        type: 'better-sqlite3',
        database: PATHS.SQLITE_DB,
        logging: false,
        synchronize: true,
        entities: [DriveFile, DriveFolder, Checkpoint],
      },
);

export const CheckpointRepository = AppDataSource.getRepository(Checkpoint);
