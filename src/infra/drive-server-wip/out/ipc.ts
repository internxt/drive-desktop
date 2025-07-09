import { driveServerWip } from '../drive-server-wip.module';

export type FromProcess = {
  storageDeleteFileByUuid: (
    props: Parameters<typeof driveServerWip.storage.deleteFileByUuid>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
  storageDeleteFolderByUuid: (
    props: Parameters<typeof driveServerWip.storage.deleteFolderByUuid>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFolderByUuid>>;
  renameFileByUuid: (
    props: Parameters<typeof driveServerWip.files.renameFile>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.files.renameFile>>;
  renameFolderByUuid: (
    props: Parameters<typeof driveServerWip.folders.renameFolder>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.folders.renameFolder>>;
  moveFileByUuid: (props: Parameters<typeof driveServerWip.files.moveFile>[0]) => Awaited<ReturnType<typeof driveServerWip.files.moveFile>>;
  moveFolderByUuid: (
    props: Parameters<typeof driveServerWip.folders.moveFolder>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.folders.moveFolder>>;
};

export type FromMain = {};
