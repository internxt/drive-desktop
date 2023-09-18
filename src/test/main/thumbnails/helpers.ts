import gm from 'gm';

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
