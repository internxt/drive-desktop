// import { Container } from 'diod';
// import { logger } from '@internxt/drive-desktop-core/build/backend';
// import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
// import { TemporalFileChunkReader } from '../../../../context/storage/TemporalFiles/application/read/TemporalFileChunkReader';
// import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
// import { StorageFilesRepository } from '../../../../context/storage/StorageFiles/domain/StorageFilesRepository';
// import { StorageFile } from '../../../../context/storage/StorageFiles/domain/StorageFile';
// import { DownloadProgressTracker } from '../../../../context/shared/domain/DownloadProgressTracker';
// import {
//   handleReadCallback,
//   type HandleReadCallbackDeps,
// } from '../../../../backend/features/fuse/on-read/handle-read-callback';
// import { buildNetworkClient } from '../../../../infra/environment/download-file/build-network-client';
// import { getCredentials } from '../../../main/auth/get-credentials';
// import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';

// export class ReadCallback {
//   constructor(private readonly container: Container) {}

// async execute(
//   path: string,
//   _fd: unknown,
//   buf: Buffer,
//   len: number,
//   pos: number,
//   cb: (code: number, params?: unknown) => void,
// ) {
//   try {
//     const { mnemonic } = getCredentials();
//     const user = DependencyInjectionUserProvider.get();
//     const network = buildNetworkClient({ bridgeUser: user.bridgeUser, userId: user.userId });
//     const repo = this.container.get(StorageFilesRepository);
//     const tracker = this.container.get(DownloadProgressTracker);

//     const deps: HandleReadCallbackDeps = {
//       findVirtualFile: (p: string) => this.container.get(FirstsFileSearcher).run({ path: p }),
//       findTemporalFile: (p: string) => this.container.get(TemporalFileByPathFinder).run(p),
//       readTemporalFileChunk: async (p: string, length: number, position: number) => {
//         const result = await this.container.get(TemporalFileChunkReader).run(p, length, position);
//         return result.isPresent() ? result.get() : undefined;
//       },
//       onDownloadProgress: (name, extension, bytesDownloaded, fileSize, elapsedTime) => {
//         tracker.downloadUpdate(name, extension, {
//           percentage: Math.min(bytesDownloaded / fileSize, 1),
//           elapsedTime,
//         });
//       },
//       saveToRepository: async (contentsId, size, uuid, name, extension) => {
//         const storage = StorageFile.from({ id: contentsId, virtualId: uuid, size });
//         await repo.register(storage);
//         tracker.downloadFinished(name, extension);
//       },
//       bucketId: user.bucket,
//       mnemonic,
//       network,
//     };

//       const result = await handleReadCallback(deps, path, len, pos);

//       if (result.isLeft()) {
//         cb(result.getLeft().code);
//         return;
//       }

//       const chunk = result.getRight();
//       chunk.copy(buf as unknown as Uint8Array);
//       cb(chunk.length);
//     } catch (err) {
//       logger.error({ msg: '[ReadCallback] Error reading file:', error: err, path });
//       cb(Fuse.EIO);
//     }
//   }
// }
