import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { DriveFolder } from '../../schema';

type TProps = {
  data: DriveFolder;
};

/**
 * Converts drive folder data into a simplified folder representation.
 *
 * @param data - The drive folder data to convert
 * @returns A simplified drive folder containing its identifiers, metadata, timestamps, and status
 */
export function parseData({ data }: TProps): SimpleDriveFolder {
  return {
    uuid: data.uuid as FolderUuid,
    name: data.plainName,
    parentUuid: data.parentUuid,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    creationTime: data.creationTime,
    modificationTime: data.modificationTime,
    status: data.status,
  };
}
