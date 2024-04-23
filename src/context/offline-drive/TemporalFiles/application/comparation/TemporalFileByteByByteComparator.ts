/* eslint-disable no-await-in-loop */
import { Service } from 'diod';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';

@Service()
export class TemporalFileByteByByteComparator {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(doc1: TemporalFilePath, doc2: TemporalFilePath): Promise<boolean> {
    return this.repository.areEqual(doc1, doc2);
  }
}
