import { resetConfig } from './reset-config';
import * as configModule from '@/apps/main/config';
import * as defaultsModule from '@/core/electron/store/defaults';
import * as fieldsToSaveModule from '@/core/electron/store/fields-to-save';

describe('resetConfig', () => {
  const configSetMock = vi.spyOn(configModule.default, 'set');
  const defaultsMock = vi.spyOn(defaultsModule, 'defaults', 'get');
  const fieldsToSaveMock = vi.spyOn(fieldsToSaveModule, 'fieldsToSave', 'get');

  beforeEach(() => {
    vi.clearAllMocks();

    configSetMock.mockReturnValue();
    fieldsToSaveMock.mockReturnValue(['backupsEnabled', 'syncRoot', 'deviceId'] as any);
    defaultsMock.mockReturnValue({
      backupsEnabled: false,
      syncRoot: '',
      deviceId: 0,
    } as any);
  });

  it('should reset all fields in fieldsToSave to their default values', () => {
    resetConfig();

    expect(configSetMock).toHaveBeenCalledWith('backupsEnabled', false);
    expect(configSetMock).toHaveBeenCalledWith('syncRoot', '');
    expect(configSetMock).toHaveBeenCalledWith('deviceId', 0);
    expect(configSetMock).toHaveBeenCalledTimes(3);
  });
});
