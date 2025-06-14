import { driveServerWip } from '../drive-server-wip.module';

export type FromProcess = {
  storageDeleteFileByUuid: (
    props: Parameters<typeof driveServerWip.storage.deleteFileByUuid>[0],
  ) => Awaited<ReturnType<typeof driveServerWip.storage.deleteFileByUuid>>;
};

export type FromMain = {};
