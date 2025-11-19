import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { AppDataSource } from '@/apps/main/database/data-source';

export const folderRepository = AppDataSource.getRepository(DriveFolder);
