import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { AppDataSource } from '@/apps/main/database/data-source';

export const fileRepository = AppDataSource.getRepository(DriveFile);
