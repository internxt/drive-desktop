import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockDeep } from 'vitest-mock-extended';
import { ContentsDownloader } from '@/infra/inxt-js';
import * as updateContentsId from '../callbacks-controllers/controllers/update-contents-id';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { checkDangledFile } from './check-dangled-file';

describe('overwrite-dangled-file', () => {
  const contentsDownloader = mockDeep<ContentsDownloader>();
  const updateContentsIdMock = partialSpyOn(updateContentsId, 'updateContentsId');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const props = mockProps<typeof checkDangledFile>({
    ctx: { contentsDownloader },
    file: { absolutePath: abs('/file.txt') },
  });

  it('should update isDangledStatus if contents is found', async () => {
    // Given
    contentsDownloader.download.mockResolvedValue({ data: 'value' as any });
    // When
    await checkDangledFile(props);
    // Then
    calls(props.ctx.logger.debug).toMatchObject([{ msg: 'Checking possible dangled file' }, { msg: 'Not dangled file' }]);
    call(invokeMock).toMatchObject(['fileUpdateByUuid', { payload: { isDangledStatus: false } }]);
  });

  it('should update contents id if contents not found', async () => {
    // Given
    contentsDownloader.download.mockResolvedValue({ error: new Error('Object not found') });
    // When
    await checkDangledFile(props);
    // Then
    call(props.ctx.logger.debug).toMatchObject({ msg: 'Checking possible dangled file' });
    call(props.ctx.logger.warn).toMatchObject({ msg: 'Dangled file found' });
    call(updateContentsIdMock).toMatchObject({ path: '/file.txt' });
  });

  it('should ignore update contents id if download gives an unknown error', async () => {
    // Given
    contentsDownloader.download.mockResolvedValue({ error: new Error('Another error') });
    // When
    await checkDangledFile(props);
    // Then
    call(props.ctx.logger.debug).toMatchObject({ msg: 'Checking possible dangled file' });
    call(props.ctx.logger.warn).toMatchObject({ msg: 'Error downloading dangled file' });
    calls(updateContentsIdMock).toHaveLength(0);
  });
});
