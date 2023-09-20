import { extractFirstPageAsReadablePNG } from '../../../main/thumbnails/application/extract-pdf-page';
import path from 'path';
import { compareImageStreams, isAnImage } from './helpers';
import { unlinkSync, writeFileSync } from 'fs';
import { ReadStreamToBuffer } from '../../../shared/fs/ReadStreamToBuffer';
import * as uuid from 'uuid';

describe('Extract First PDF page', () => {
  const filesToClean: Array<string> = [];

  function useTemporalPNGFile() {
    const name = path.join(__dirname, `${uuid.v4()}.png`);
    filesToClean.push(name);

    return name;
  }

  afterAll(() => {
    filesToClean.forEach(unlinkSync);
  });

  it('extracts a png from a pdf', async () => {
    const source = path.join(__dirname, 'fixtures', 'source.pdf');

    const readable = await extractFirstPageAsReadablePNG(source);

    expect(await isAnImage(readable)).toBe(true);
  });

  it('the extracted png is the expected', async () => {
    const expected = path.join(__dirname, 'fixtures', 'result.png');
    const source = path.join(__dirname, 'fixtures', 'source.pdf');
    const resultPath = useTemporalPNGFile();

    const result = await extractFirstPageAsReadablePNG(source);

    writeFileSync(resultPath, await ReadStreamToBuffer.read(result));

    const { isEqual } = await compareImageStreams(expected, resultPath);

    expect(isEqual).toBe(true);
  });
});
