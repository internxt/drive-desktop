import { ServerFolder } from '../../../../../filesystems/domain/ServerFolder';
import { Stopwatch } from '../../../../../../shared/types/Stopwatch';
import { ServerFileMother } from '../../../files/test/infrastructure/persistance/ServerFileMother';
import { Traverser } from '../../application/Traverser';
import Chance from 'chance';
const change = new Chance();

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

function createFolder(folderId: number, parentId: number) {
  const name = change.word();
  return {
    id: folderId,
    parentId,
    plain_name: name,
    status: 'EXISTS',
  } as ServerFolder;
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

type ResultData = Record<string, number>;

describe('Traverser Benchmark', () => {
  const setOfFiles = [0, 10, 100, 1_000, 10_000, 100_000, 1_000_000];
  const rootFolderId = 1970049743;
  const traverser = new Traverser(
    {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      decryptName: (name: string, _a: string, _b: string) => name,
    },
    rootFolderId
  );

  const stopwatch = new Stopwatch();

  beforeEach(() => {
    stopwatch.reset();
  });

  describe('Tree with all files in the root level', () => {
    const resultData: ResultData = {};

    afterAll(() => {
      console.log('Tree with all files in the root level', resultData);
    });

    it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
      const files = initializeArrayWith(numberOfFiles, () =>
        ServerFileMother.fromPartial({
          folderId: rootFolderId,
        })
      );

      const tree = { files, folders: [] as Array<ServerFolder> };

      stopwatch.start();

      traverser.run(tree);

      stopwatch.finish();

      resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
    });
  });

  describe('Tree with all files in the firts nested level', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log('Tree with all files in the firts nested level', resultData);
    });

    it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
      const folderId = 3654437010;
      const files = createFilesOnfolder(folderId, numberOfFiles);

      const tree = {
        files,
        folders: [createFolder(folderId, rootFolderId)],
      };

      stopwatch.start();

      traverser.run(tree);

      stopwatch.finish();

      resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
    });
  });

  describe('Tree with half files in the root level and half on the firts', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log(
        'Tree with half files in the root level and half on the firts',
        resultData
      );
    });

    it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
      const folderId = 3654437010;

      const filesOnRoot = createFilesOnfolder(rootFolderId, numberOfFiles / 2);
      const filesOnFirtLevel = createFilesOnfolder(folderId, numberOfFiles / 2);

      const tree = {
        files: shuffle([...filesOnRoot, ...filesOnFirtLevel]),
        folders: [createFolder(folderId, rootFolderId)],
      };

      stopwatch.start();

      traverser.run(tree);

      stopwatch.finish();

      resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
    });
  });

  describe('Tree with files in 2 first level folders', () => {
    const resultData: Record<string, number> = {};

    afterAll(() => {
      console.log('Tree with files in 2 first level folders', resultData);
    });

    it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
      const folderA = 3654437010;
      const folderB = 1601444569;

      const filesOnRoot = createFilesOnfolder(folderA, numberOfFiles / 2);
      const filesOnFirtLevel = createFilesOnfolder(folderB, numberOfFiles / 2);

      const tree = {
        files: shuffle([...filesOnRoot, ...filesOnFirtLevel]),
        folders: [
          createFolder(folderA, rootFolderId),

          createFolder(folderB, rootFolderId),
        ],
      };

      stopwatch.start();

      traverser.run(tree);

      stopwatch.finish();

      resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
    });
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

      it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
        const folderA = 3654437010;
        const folderB = 1601444569;
        const folderC = 2201372660;

        const filesOnFolderA = createFilesOnfolder(folderA, numberOfFiles / 3);
        const filesOnFolderB = createFilesOnfolder(folderB, numberOfFiles / 3);
        const filesOnFolderC = createFilesOnfolder(folderC, numberOfFiles / 3);

        const tree = {
          files: shuffle([
            ...filesOnFolderA,
            ...filesOnFolderB,
            ...filesOnFolderC,
          ]),
          folders: [
            createFolder(folderA, rootFolderId),
            createFolder(folderB, rootFolderId),
            createFolder(folderC, folderB),
          ],
        };

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      });
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

      it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
        const folderA = 3654437010;
        const folderB = 1601444569;
        const folderC = 2201372660;
        const folderD = 3714235330;
        const folderE = 23456392;
        const folderF = 854120130;

        const filesOnFolderA = createFilesOnfolder(folderA, numberOfFiles / 6);
        const filesOnFolderB = createFilesOnfolder(folderB, numberOfFiles / 6);
        const filesOnFolderC = createFilesOnfolder(folderC, numberOfFiles / 6);
        const filesOnFolderD = createFilesOnfolder(folderD, numberOfFiles / 6);
        const filesOnFolderE = createFilesOnfolder(folderE, numberOfFiles / 6);
        const filesOnFolderF = createFilesOnfolder(folderF, numberOfFiles / 6);

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
            createFolder(folderA, rootFolderId),
            createFolder(folderB, folderA),
            createFolder(folderC, folderB),
            createFolder(folderD, rootFolderId),
            createFolder(folderE, folderD),
            createFolder(folderF, folderE),
          ],
        };

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      });
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

      it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
        const folderA = 3654437010;
        const folderB = 1601444569;
        const folderC = 2201372660;
        const folderD = 3714235330;
        const folderE = 23456392;
        const folderF = 854120130;

        const filesOnFolderA = createFilesOnfolder(folderA, numberOfFiles / 6);
        const filesOnFolderB = createFilesOnfolder(folderB, numberOfFiles / 6);
        const filesOnFolderC = createFilesOnfolder(folderC, numberOfFiles / 6);
        const filesOnFolderD = createFilesOnfolder(folderD, numberOfFiles / 6);
        const filesOnFolderE = createFilesOnfolder(folderE, numberOfFiles / 6);
        const filesOnFolderF = createFilesOnfolder(folderF, numberOfFiles / 6);

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
            createFolder(folderA, rootFolderId),
            createFolder(folderB, rootFolderId),
            createFolder(folderC, rootFolderId),
            createFolder(folderD, rootFolderId),
            createFolder(folderE, rootFolderId),
            createFolder(folderF, rootFolderId),
          ],
        };

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      });
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

      it.each(setOfFiles)('tree with %p files', (numberOfFiles) => {
        const folderA = 3654437010;
        const folderB = 1601444569;
        const folderC = 2201372660;
        const folderD = 3714235330;
        const folderE = 23456392;
        const folderF = 854120130;

        const filesOnFolderA = createFilesOnfolder(folderA, numberOfFiles / 6);
        const filesOnFolderB = createFilesOnfolder(folderB, numberOfFiles / 6);
        const filesOnFolderC = createFilesOnfolder(folderC, numberOfFiles / 6);
        const filesOnFolderD = createFilesOnfolder(folderD, numberOfFiles / 6);
        const filesOnFolderE = createFilesOnfolder(folderE, numberOfFiles / 6);
        const filesOnFolderF = createFilesOnfolder(folderF, numberOfFiles / 6);

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
            createFolder(folderA, rootFolderId),
            createFolder(folderB, folderA),
            createFolder(folderC, folderB),
            createFolder(folderD, folderC),
            createFolder(folderE, folderD),
            createFolder(folderF, folderF),
          ],
        };

        stopwatch.start();

        traverser.run(tree);

        stopwatch.finish();

        resultData[`with ${numberOfFiles} files`] = stopwatch.elapsedTime();
      });
    });
  });
});
