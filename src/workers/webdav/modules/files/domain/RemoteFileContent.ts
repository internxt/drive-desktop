import { Readable } from 'stream';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';
import { FileDownloadedDomainEvent } from './FileDownloadedDomainEvent';
import { WebdavFile } from './WebdavFile';

export class RemoteFileContents extends AggregateRoot {
  private constructor(
    public readonly id: string,
    public readonly size: number,
    public readonly type: string,
    public readonly contents: Readable
  ) {
    super();
  }

  static retrive(file: WebdavFile, contents: Readable): RemoteFileContents {
    const remoteContents = new RemoteFileContents(
      file.fileId,
      file.size.value,
      file.type,
      contents
    );

    const event = new FileDownloadedDomainEvent({
      aggregateId: remoteContents.id,
      size: remoteContents.size,
      type: remoteContents.type,
    });

    remoteContents.record(event);

    return remoteContents;
  }

  toPrimitives(): Record<string, string | number | boolean> {
    throw new Error('Dont knwow what to do');
  }
}
