import { generateReport } from './generate-report';
import { CleanableItem } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

describe('generateReport', () => {
  const mockCleanableItems1: CleanableItem[] = [
    {
      fullPath: 'G:\\Users\\User\\file1.tmp',
      fileName: 'file1.tmp',
      sizeInBytes: 1024,
    },
    {
      fullPath: 'G:\\Users\\User\\file2.tmp',
      fileName: 'file2.tmp',
      sizeInBytes: 2048,
    },
  ];

  const mockCleanableItems2: CleanableItem[] = [
    {
      fullPath: 'G:\\Users\\User\\file3.cache',
      fileName: 'file3.cache',
      sizeInBytes: 512,
    },
  ];

  const mockCleanableItems3: CleanableItem[] = [
    {
      fullPath: 'G:\\Users\\User\\file4.log',
      fileName: 'file4.log',
      sizeInBytes: 4096,
    },
  ];

  it('should generate a report with all items and total size when all promises are fulfilled', async () => {
    // Given
    const promises = [Promise.resolve(mockCleanableItems1), Promise.resolve(mockCleanableItems2), Promise.resolve(mockCleanableItems3)];
    // When
    const result = await generateReport({ promises });
    // Then
    expect(result.items).toHaveLength(4);
    expect(result.items).toMatchObject([...mockCleanableItems1, ...mockCleanableItems2, ...mockCleanableItems3]);
    expect(result.totalSizeInBytes).toBe(7680);
  });

  it('should generate a report excluding rejected promises', async () => {
    // Given
    const promises = [
      Promise.resolve(mockCleanableItems1),
      Promise.reject(new Error('Failed to scan directory')),
      Promise.resolve(mockCleanableItems3),
    ];
    // When
    const result = await generateReport({ promises });
    // Then
    expect(result.items).toHaveLength(3);
    expect(result.items).toMatchObject([...mockCleanableItems1, ...mockCleanableItems3]);
    expect(result.totalSizeInBytes).toBe(7168);
  });

  it('should generate an empty report when all promises are rejected', async () => {
    // Given
    const promises = [Promise.reject(new Error('Error 1')), Promise.reject(new Error('Error 2')), Promise.reject(new Error('Error 3'))];
    // When
    const result = await generateReport({ promises });
    // Then
    expect(result.items).toHaveLength(0);
    expect(result.items).toMatchObject([]);
    expect(result.totalSizeInBytes).toBe(0);
  });
});
