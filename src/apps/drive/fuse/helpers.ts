import { exec } from 'child_process';
import Fuse from 'fuse-native';

export function unmountFusedDirectory(mountPoint: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`umount ${mountPoint}`, (error, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        // If there's anything in stderr, it usually indicates an error
        reject(new Error(stderr));
        return;
      }

      resolve(stdout);
    });
  });
}

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

export function unmountPromise(fuse: Fuse): Promise<void> {
  return new Promise((resolve, reject) => {
    fuse.unmount((err: unknown) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}
