import { promises as fs } from 'fs';
import { BrowserWindow } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { CleanerViewModel, CleanupProgress } from './cleaner.types';
import { storedCleanerReport } from './generate-cleaner-report';
import { getAllItemsToDelete } from './utils/selection-utils';

// Global cleanup state
let currentAbortController: AbortController | null = null;
let totalFilesToDelete = 0;
let deletedFilesCount = 0;
let totalSpaceGained = 0;

/**
 * Send progress update to renderer
 */
function emitProgress(progressData: CleanupProgress) {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send('cleaner:cleanup-progress', progressData);
    }
  }
}

/**
 * Delete a single file safely
 */
async function deleteFileSafely(
  filePath: string
): Promise<{ success: boolean; size: number }> {
  try {
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    await fs.unlink(filePath);

    return { success: true, size: fileSize };
  } catch (error) {
    logger.warn({
      msg: 'Failed to delete file, continuing with next file',
      filePath,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, size: 0 };
  }
}

/**
 * Start the cleanup process
 */
export async function startCleanup(viewModel: CleanerViewModel): Promise<void> {
  // Check if cleanup is already in progress
  if (currentAbortController) {
    logger.warn({ msg: 'Cleanup already in progress, ignoring new request' });
    return;
  }

  // Check if we have a stored report
  if (!storedCleanerReport) {
    throw new Error('No cleaner report available. Generate a report first.');
  }

  // Initialize cleanup state
  currentAbortController = new AbortController();
  deletedFilesCount = 0;
  totalSpaceGained = 0;

  // Get all items to delete
  const itemsToDelete = getAllItemsToDelete(viewModel, storedCleanerReport);
  totalFilesToDelete = itemsToDelete.length;

  logger.debug({
    msg: 'Starting cleanup process',
    totalFiles: totalFilesToDelete,
  });

  // 1. Emit initial progress - before start
  emitProgress({
    currentCleaningPath: '',
    progress: 0,
    deletedFiles: 0,
    spaceGained: 0,
    cleaning: true,
    cleaningCompleted: false,
  });

  // Process each file
  for (let i = 0; i < itemsToDelete.length; i++) {
    // Check if cleanup was aborted
    if (currentAbortController.signal.aborted) {
      logger.debug({ msg: 'Cleanup process was aborted' });
      break;
    }

    const item = itemsToDelete[i];
    const result = await deleteFileSafely(item.fullPath);

    if (result.success) {
      deletedFilesCount++;
      totalSpaceGained += result.size;
    }

    // 2. Emit progress after each deletion attempt
    const progress = Math.round(((i + 1) / totalFilesToDelete) * 100);
    emitProgress({
      currentCleaningPath: item.fileName,
      progress,
      deletedFiles: deletedFilesCount,
      spaceGained: totalSpaceGained,
      cleaning: true,
      cleaningCompleted: false,
    });
  }

  // 3. Emit completion - at finish (always completed: true)
  emitProgress({
    currentCleaningPath: '',
    progress: 100,
    deletedFiles: deletedFilesCount,
    spaceGained: totalSpaceGained,
    cleaning: false,
    cleaningCompleted: true,
  });

  logger.debug({
    msg: 'Cleanup process finished',
    deletedFiles: deletedFilesCount,
    totalFiles: totalFilesToDelete,
  });

  currentAbortController = null;
}

/**
 * Stop the current cleanup process
 */
export function stopCleanup(): void {
  if (currentAbortController) {
    logger.debug({ msg: 'Stopping cleanup process' });
    currentAbortController.abort();
  } else {
    logger.warn({ msg: 'No cleanup process to stop' });
  }
}
