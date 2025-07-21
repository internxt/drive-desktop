/* eslint-disable import/no-default-export */

declare module '@internxt/scan' {
  type InitParams = {
    removeInfected: boolean;
    debugMode: boolean;
    scanRecursively: boolean;
    clamdscan: {
      path: string;
      socket: boolean | string;
      host: string;
      localFallback: boolean;
      port: number;
      timeout: number;
      multiscan: boolean;
      active: boolean;
    };
    preference: 'clamdscan';
  };

  export default class NodeClam {
    closeAllSockets(): Promise<void>;
    init(params: InitParams): Promise<NodeClam>;
    isInfected(filePath: string): Promise<{ file: string; isInfected: boolean; viruses: [] }>;
    ping(): Promise<boolean>;
  }
}

declare module '@internxt/scan/lib/NodeClamError' {
  export default class NodeClamError {}
}
