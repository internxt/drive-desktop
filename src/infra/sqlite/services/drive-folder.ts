import { AppDataSource } from '@/apps/main/database/data-source';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';

export const folderRepository = AppDataSource.getRepository(DriveFolder);
