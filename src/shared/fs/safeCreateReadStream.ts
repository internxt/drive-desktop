import fs from "fs";
import { Readable } from "stream";

export class SafeCreateReadStream {
  create(path: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
      fs.access(path, fs.constants.F_OK, (err) => {
        if (err) {
          reject(err);
        }

        resolve(fs.createReadStream(path));
      });
    });
  }
}
