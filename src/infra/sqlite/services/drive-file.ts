import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

export const fileRepository = AppDataSource.getRepository(DriveFile);
