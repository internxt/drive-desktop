import Fuse from 'fuse-native';

export function mountPromise(fuse: Fuse): Promise<void> {
  return new Promise((resolve, reject) => {
    fuse.mount((err: unknown) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}
