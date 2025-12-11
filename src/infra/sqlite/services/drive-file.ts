import { DriveFile } from '../../../apps/main/database/entities/DriveFile';
import { AppDataSource } from '../../../apps/main/database/data-source';
import { Repository } from 'typeorm';

export const fileRepository: Repository<DriveFile> = AppDataSource.getRepository(DriveFile);