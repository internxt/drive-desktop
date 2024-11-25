import NodeClam from 'clamscan';
import path from 'path';

const directoryInstallWindows = path.join(
  __dirname,
  'clamav-bin',
  'clamav-1.4.1.win.x64'
);
const directoryQuarantine = path.join(__dirname, 'quarantine');

export class AntivirusWorker {
  private static instance: AntivirusWorker;
  private clamAv: NodeClam | null = null;

  private constructor() {
    //
  }

  static async getInstance(): Promise<AntivirusWorker> {
    if (!AntivirusWorker.instance) {
      AntivirusWorker.instance = new AntivirusWorker();
      await AntivirusWorker.instance.initialize();
    }

    return AntivirusWorker.instance;
  }

  private async initialize(): Promise<void> {
    try {
      this.clamAv = await new NodeClam().init({
        removeInfected: false,
        quarantineInfected: directoryQuarantine,
        debugMode: false,
        fileList: undefined,
        scanRecursively: true,
        clamscan: {
          path: path.join(directoryInstallWindows, 'clamscan.exe'),
          scanArchives: true,
          active: true,
        },
        clamdscan: {
          socket: false,
          host: false,
          port: false,
          timeout: 60000,
          localFallback: true,
          path: path.join(directoryInstallWindows, 'clamdscan.exe'),
          configFile: undefined,
          multiscan: true,
          reloadDb: false,
          active: true,
          bypassTest: false,
        },
        preference: 'clamdscan',
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async scanFile(filePath: string): Promise<
    | NodeClam.Response<{
        file: string;
        isInfected: boolean | null;
      }>
    | undefined
  > {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    try {
      const result = await this.clamAv.isInfected(filePath);
      return result;
    } catch (error) {
      console.log('ERROR WHILE SCANNING A FILE: ', error);
      return undefined;
    }
  }

  async scanFolder(filePath: string): Promise<
    | NodeClam.Response<{
        path: string;
        isInfected: boolean;
        goodFiles: string[];
        badFiles: string[];
      }>
    | undefined
  > {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    try {
      const result = await this.clamAv.scanDir(filePath);
      return result;
    } catch (error) {
      console.log('ERROR WHILE SCANNING A FOLDER: ', error);
      return undefined;
    }
  }

  async scanItems(filePath: string[]): Promise<
    | NodeClam.Response<{
        goodFiles: string[];
        badFiles: string[];
        errors: {
          [filename: string]: NodeClam.NodeClamError;
        };
      }>
    | undefined
  > {
    if (!this.clamAv) {
      throw new Error('ClamAv instance is not initialized');
    }

    try {
      const result = this.clamAv.scanFiles(filePath);
      return result;
    } catch (error) {
      console.log('ERROR WHILE SCAN ITEMS: ', error);
      return undefined;
    }
  }
}
