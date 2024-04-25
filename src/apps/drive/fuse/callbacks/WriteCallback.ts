import { Container } from 'diod';
import { TemporalFileWriter } from '../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';

export class WriteCallback {
  constructor(private readonly container: Container) {}

  async execute(
    path: string,
    _fd: string,
    buffer: Buffer,
    len: number,
    pos: number,
    cb: (a: number) => void
  ) {
    await this.container.get(TemporalFileWriter).run(path, buffer, len, pos);

    return cb(len);
  }
}
