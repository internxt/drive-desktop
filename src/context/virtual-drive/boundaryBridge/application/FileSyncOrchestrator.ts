import { getIssueAffectedFiles, updateFileInBatch } from '@/apps/main/remote-sync/handlers';
import { isTemporaryFile } from '../../../../apps/utils/isTemporalFile';
import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileSyncronizer } from '../../files/application/FileSyncronizer';
import Logger from 'electron-log';

export class FileSyncOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileSyncronizer: FileSyncronizer
  ) {}

  async run(absolutePaths: string[]): Promise<void> {

    const filesWithIssues = await getIssueAffectedFiles();
    const issuePathFiles = [];

    const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
    const endDate = new Date('2025-03-04T13:00:00.000Z').getTime();


    for (const file of filesWithIssues) {
      const fileDate = (new Date(file.createdAt)).getTime();

      if (fileDate >= startDate && fileDate <= endDate) {
        issuePathFiles.push(file.fileId);
      }
    }

    if (issuePathFiles.length > 0) {
      Logger.debug(`Issue affected files: ${issuePathFiles}`);
      const overridedFiles = await this.fileSyncronizer.overrideCorruptedFiles(issuePathFiles);
      // update CreatedAt to avoid reprocessing

      const toUpdateInDatabase = overridedFiles.reduce((acc: string[], current) => {
        if (current.updated) {
          acc.push(current.path);
        }
        return acc;
      }, []);

      Logger.debug(`Updating files in database: ${toUpdateInDatabase}`);

      await updateFileInBatch(toUpdateInDatabase, { status: 'TRASHED' });
    }


    for (const absolutePath of absolutePaths) {
      const tempFile = await isTemporaryFile(absolutePath);

      if (tempFile) {
        Logger.debug(`Skipping temporary file: ${absolutePath}`);
        continue;
      }
      try {
        await this.fileSyncronizer.run(
          absolutePath,
          this.contentsUploader.run.bind(this.contentsUploader)
        );
      } catch (error) {
        console.error(error);
      }
    }
  }
}
