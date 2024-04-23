import { FileTrasher } from '../../../../../src/context/virtual-drive/files/application/trash/FileTrasher';

export class FileDeleterFactory {
  static deletionSuccess(): FileTrasher {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      run: (_id: string) => {
        //no-op
      },
    } as unknown as FileTrasher;
  }
}
