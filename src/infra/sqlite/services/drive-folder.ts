import { DriveFolder } from '../../../apps/main/database/entities/DriveFolder';
import { AppDataSource } from '../../../apps/main/database/data-source';
import { Repository } from 'typeorm';

export const folderRepository: Repository<DriveFolder> = AppDataSource.getRepository(DriveFolder);
