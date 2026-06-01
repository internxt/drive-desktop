import { type Network } from '@internxt/sdk';

export type ReadRange = {
  position: number;
  length: number;
};

export type HandleReadDeps = {
  onDownloadProgress: (
    name: string,
    extension: string,
    bytesDownloaded: number,
    fileSize: number,
    elapsedTime: number,
  ) => void;
  saveToRepository: (contentsId: string, size: number, uuid: string, name: string, extension: string) => Promise<void>;
  bucketId: string;
  mnemonic: string;
  network: Network.Network;
};
