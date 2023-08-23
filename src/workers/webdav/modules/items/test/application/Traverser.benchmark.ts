import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import { Stopwatch } from '../../../../../../shared/types/Stopwatch';
import { ServerFileMother } from '../../../files/test/infrastructure/persistance/ServerFileMother';
import { Traverser } from '../../application/Traverser';

function initializeArrayWith<T>(n: number, fn: () => T): Array<T> {
  const array = new Array<T>();

  for (let i = 0; i < n; i++) {
    array.push(fn());
  }

  return array;
}

function createFilesOnfolder(folderId: number, numberOfFiles: number) {
  return initializeArrayWith(numberOfFiles, () =>
    ServerFileMother.fromPartial({
      folderId,
    })
  );
}

function shuffle<T>(array: Array<T>): Array<T> {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

const fakeDecryptor = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decryptName: (name: string, _a: string, _b: string) => name,
};

type ResultData = Record<string, number>;

describe('Traverser Benchmark', () => {
  const rootFolderId = 1970049743;
  const stopwatch = new Stopwatch();

  beforeEach(() => {
    stopwatch.reset();
  });

  describe('Tree with all files in the root level', () => {
    const resultData: ResultData = {};

    afterAll(() => {
      console.log('Tree with all files in the root level', resultData);
    });

    it.each([0, 100, 1_000, 10_000, 100_000])(
      'tree with %p files',
      (numberOfFiles) => {
        const files = initializeArrayWith(numberOfFiles, () =>
          ServerFileMother.fromPartial({
            folderId: rootFolderId,
          })
        );

        const tree = { files, folders: [] as Array<ServerFolder> };

        const traverser = new Traverser(fakeDecryptor, rootFolderId);

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      }
    );
  });

  describe('Tree with all files in the firts nested level', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log('Tree with all files in the firts nested level', resultData);
    });

    it.each([0, 100, 1_000, 10_000, 100_000])(
      'tree with %p files',
      (numberOfFiles) => {
        const folderId = 3654437010;
        const files = initializeArrayWith(numberOfFiles, () =>
          ServerFileMother.fromPartial({
            folderId: folderId,
          })
        );

        const tree = {
          files,
          folders: [
            {
              id: folderId,
              parentId: rootFolderId,
              plain_name: 'folder A',
              status: 'EXISTS',
            } as ServerFolder,
          ],
        };

        const traverser = new Traverser(fakeDecryptor, rootFolderId);

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      }
    );
  });

  describe('Tree with half files in the root level and half on the firts', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log(
        'Tree with half files in the root level and half on the firts',
        resultData
      );
    });

    it.each([0, 100, 1_000, 10_000, 100_000])(
      'tree with %p files',
      (numberOfFiles) => {
        const folderId = 3654437010;
        const filesOnRoot = initializeArrayWith(numberOfFiles / 2, () =>
          ServerFileMother.fromPartial({
            folderId: rootFolderId,
          })
        );
        const filesOnFirtLevel = initializeArrayWith(numberOfFiles / 2, () =>
          ServerFileMother.fromPartial({
            folderId: folderId,
          })
        );

        const tree = {
          files: shuffle([...filesOnRoot, ...filesOnFirtLevel]),
          folders: [
            {
              id: folderId,
              parentId: rootFolderId,
              plain_name: 'folder A',
              status: 'EXISTS',
            } as ServerFolder,
          ],
        };

        const traverser = new Traverser(fakeDecryptor, rootFolderId);

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      }
    );
  });

  describe('Tree with files in 2 first level folders', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log('Tree with files in 2 first level folders', resultData);
    });

    it.each([0, 100, 1_000, 10_000, 100_000])(
      'tree with %p files',
      (numberOfFiles) => {
        const folderA = 3654437010;
        const folderB = 1601444569;
        const filesOnRoot = initializeArrayWith(numberOfFiles / 2, () =>
          ServerFileMother.fromPartial({
            folderId: folderA,
          })
        );
        const filesOnFirtLevel = initializeArrayWith(numberOfFiles / 2, () =>
          ServerFileMother.fromPartial({
            folderId: folderB,
          })
        );

        const tree = {
          files: shuffle([...filesOnRoot, ...filesOnFirtLevel]),
          folders: [
            {
              id: folderA,
              parentId: rootFolderId,
              plain_name: 'folder A',
              status: 'EXISTS',
            } as ServerFolder,
            {
              id: folderB,
              parentId: rootFolderId,
              plain_name: 'folder B',
              status: 'EXISTS',
            } as ServerFolder,
          ],
        };

        const traverser = new Traverser(fakeDecryptor, rootFolderId);

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      }
    );
  });

  describe('Complex trees', () => {
    describe(`
      root
        📁 A: [1 / 3 of files]
        📁 B: [1 / 3 of files]
          📁 C: [1 / 3 fo files]
    `, () => {
      const resultData: Record<string, number> = {};

      afterAll(() => {
        console.log('Complex tree #1', resultData);
      });

      it.each([0, 100, 1_000, 10_000, 100_000])(
        'tree with %p files',
        (numberOfFiles) => {
          const folderA = 3654437010;
          const folderB = 1601444569;
          const folderC = 2201372660;
          const filesOnFolderA = initializeArrayWith(numberOfFiles / 3, () =>
            ServerFileMother.fromPartial({
              folderId: folderA,
            })
          );
          const filesOnFolderB = initializeArrayWith(numberOfFiles / 3, () =>
            ServerFileMother.fromPartial({
              folderId: folderB,
            })
          );
          const filesOnFolderC = initializeArrayWith(numberOfFiles / 3, () =>
            ServerFileMother.fromPartial({
              folderId: folderC,
            })
          );

          const tree = {
            files: shuffle([
              ...filesOnFolderA,
              ...filesOnFolderB,
              ...filesOnFolderC,
            ]),
            folders: [
              {
                id: folderA,
                parentId: rootFolderId,
                plain_name: 'folder A',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderB,
                parentId: rootFolderId,
                plain_name: 'folder B',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderC,
                parentId: folderB,
                plain_name: 'folder C',
                status: 'EXISTS',
              } as ServerFolder,
            ],
          };

          const traverser = new Traverser(fakeDecryptor, rootFolderId);

          stopwatch.start();

          traverser.run(tree);

          stopwatch.finish();

          resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
        }
      );
    });

    describe(`
      root
        📁 A: [1 / 6 of files]
          📁 B: [1 / 6 of files]
            📁 C: [1 / 6 of files]
        📁 D: [1 / 6 files]
          📁 E: [1 / 6 files]
            📁 F: [1 / 6 files]

    `, () => {
      const resultData: Record<string, number> = {};

      afterAll(() => {
        console.log('Complex tree #2', resultData);
      });

      it.each([0, 100, 1_000, 10_000, 100_000])(
        'tree with %p files',
        (numberOfFiles) => {
          const folderA = 3654437010;
          const folderB = 1601444569;
          const folderC = 2201372660;
          const folderD = 3714235330;
          const folderE = 23456392;
          const folderF = 854120130;

          const filesOnFolderA = createFilesOnfolder(
            folderA,
            numberOfFiles / 6
          );
          const filesOnFolderB = createFilesOnfolder(
            folderB,
            numberOfFiles / 6
          );
          const filesOnFolderC = createFilesOnfolder(
            folderC,
            numberOfFiles / 6
          );
          const filesOnFolderD = createFilesOnfolder(
            folderD,
            numberOfFiles / 6
          );
          const filesOnFolderE = createFilesOnfolder(
            folderE,
            numberOfFiles / 6
          );
          const filesOnFolderF = createFilesOnfolder(
            folderF,
            numberOfFiles / 6
          );

          const tree = {
            files: shuffle([
              ...filesOnFolderA,
              ...filesOnFolderB,
              ...filesOnFolderC,
              ...filesOnFolderD,
              ...filesOnFolderE,
              ...filesOnFolderF,
            ]),
            folders: [
              {
                id: folderA,
                parentId: rootFolderId,
                plain_name: 'folder A',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderB,
                parentId: folderA,
                plain_name: 'folder B',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderC,
                parentId: folderB,
                plain_name: 'folder C',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderD,
                parentId: rootFolderId,
                plain_name: 'folder D',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderE,
                parentId: folderD,
                plain_name: 'folder E',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderF,
                parentId: folderE,
                plain_name: 'folder F',
                status: 'EXISTS',
              } as ServerFolder,
            ],
          };

          const traverser = new Traverser(fakeDecryptor, rootFolderId);

          stopwatch.start();

          traverser.run(tree);

          stopwatch.finish();

          resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
        }
      );
    });

    describe(`
      root
        📁 A: [1 / 6 of files]
        📁 B: [1 / 6 of files]
        📁 C: [1 / 6 of files]
        📁 D: [1 / 6 files]
        📁 E: [1 / 6 files]
        📁 F: [1 / 6 files]

    `, () => {
      const resultData: Record<string, number> = {};

      afterAll(() => {
        console.log('Complex tree #3', resultData);
      });

      it.each([0, 100, 1_000, 10_000, 100_000])(
        'tree with %p files',
        (numberOfFiles) => {
          const folderA = 3654437010;
          const folderB = 1601444569;
          const folderC = 2201372660;
          const folderD = 3714235330;
          const folderE = 23456392;
          const folderF = 854120130;

          const filesOnFolderA = createFilesOnfolder(
            folderA,
            numberOfFiles / 6
          );
          const filesOnFolderB = createFilesOnfolder(
            folderB,
            numberOfFiles / 6
          );
          const filesOnFolderC = createFilesOnfolder(
            folderC,
            numberOfFiles / 6
          );
          const filesOnFolderD = createFilesOnfolder(
            folderD,
            numberOfFiles / 6
          );
          const filesOnFolderE = createFilesOnfolder(
            folderE,
            numberOfFiles / 6
          );
          const filesOnFolderF = createFilesOnfolder(
            folderF,
            numberOfFiles / 6
          );

          const tree = {
            files: shuffle([
              ...filesOnFolderA,
              ...filesOnFolderB,
              ...filesOnFolderC,
              ...filesOnFolderD,
              ...filesOnFolderE,
              ...filesOnFolderF,
            ]),
            folders: [
              {
                id: folderA,
                parentId: rootFolderId,
                plain_name: 'folder A',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderB,
                parentId: rootFolderId,
                plain_name: 'folder B',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderC,
                parentId: rootFolderId,
                plain_name: 'folder C',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderD,
                parentId: rootFolderId,
                plain_name: 'folder D',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderE,
                parentId: rootFolderId,
                plain_name: 'folder E',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderF,
                parentId: rootFolderId,
                plain_name: 'folder F',
                status: 'EXISTS',
              } as ServerFolder,
            ],
          };

          const traverser = new Traverser(fakeDecryptor, rootFolderId);

          stopwatch.start();

          traverser.run(tree);

          stopwatch.finish();

          resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
        }
      );
    });
    describe(`
      root
        📁 A: [1 / 6 of files]
          📁 B: [1 / 6 of files]
            📁 C: [1 / 6 of files]
              📁 D: [1 / 6 files]
                📁 E: [1 / 6 files]
                  📁 F: [1 / 6 files]

    `, () => {
      const resultData: Record<string, number> = {};

      afterAll(() => {
        console.log('Complex tree #4', resultData);
      });

      it.each([0, 100, 1_000, 10_000, 100_000])(
        'tree with %p files',
        (numberOfFiles) => {
          const folderA = 3654437010;
          const folderB = 1601444569;
          const folderC = 2201372660;
          const folderD = 3714235330;
          const folderE = 23456392;
          const folderF = 854120130;

          const filesOnFolderA = createFilesOnfolder(
            folderA,
            numberOfFiles / 6
          );
          const filesOnFolderB = createFilesOnfolder(
            folderB,
            numberOfFiles / 6
          );
          const filesOnFolderC = createFilesOnfolder(
            folderC,
            numberOfFiles / 6
          );
          const filesOnFolderD = createFilesOnfolder(
            folderD,
            numberOfFiles / 6
          );
          const filesOnFolderE = createFilesOnfolder(
            folderE,
            numberOfFiles / 6
          );
          const filesOnFolderF = createFilesOnfolder(
            folderF,
            numberOfFiles / 6
          );

          const tree = {
            files: shuffle([
              ...filesOnFolderA,
              ...filesOnFolderB,
              ...filesOnFolderC,
              ...filesOnFolderD,
              ...filesOnFolderE,
              ...filesOnFolderF,
            ]),
            folders: [
              {
                id: folderA,
                parentId: rootFolderId,
                plain_name: 'folder A',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderB,
                parentId: folderA,
                plain_name: 'folder B',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderC,
                parentId: folderB,
                plain_name: 'folder C',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderD,
                parentId: folderC,
                plain_name: 'folder D',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderE,
                parentId: folderD,
                plain_name: 'folder E',
                status: 'EXISTS',
              } as ServerFolder,
              {
                id: folderF,
                parentId: folderF,
                plain_name: 'folder F',
                status: 'EXISTS',
              } as ServerFolder,
            ],
          };

          const traverser = new Traverser(fakeDecryptor, rootFolderId);

          stopwatch.start();

          traverser.run(tree);

          stopwatch.finish();

          resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
        }
      );
    });
  });
});
