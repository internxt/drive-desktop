import gm from 'gm';
import { Readable } from 'stream';

export async function getFileSize(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    gm(buffer).size({ bufferStream: true }, function (err, size) {
      if (err) reject(err);

      resolve(size);
    });
  });
}

export async function isAnImage(data: Readable): Promise<boolean> {
  return new Promise((resolve) => {
    gm(data).identify((err: Error | null) => {
      resolve(err === null);
    });
  });
}

export function compareImageStreams(
  a: string,
  b: string
): Promise<{ isEqual: boolean; equality: number }> {
  return new Promise((resolve, reject) => {
    gm.compare(a, b, (err, isEqual, equality) => {
      if (err) {
        reject(err);
      } else {
        resolve({ isEqual, equality });
      }
    });
  });
}
