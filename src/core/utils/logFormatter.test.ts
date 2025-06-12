import { logFormatter } from './logFormatter';
import { FormatParams } from 'electron-log';

describe('logFormatter', () => {
  it('should include GMT+2 formatted timestamp and message data', () => {
    const formatParams: FormatParams = {
      data: ['App started'],
      level: 'info',
      logger: {} as any,
      transport: {} as any,
      message: {
        data: ['App started'],
        level: 'info',
        date: new Date('2025-04-17T12:00:00.000Z'),
      },
    };

    const result = logFormatter(formatParams);

    expect(result[0]).toBe('[2025-04-17 14:00:00.000]');
    expect(result.slice(1)).toEqual(['App started']);
  });

  it('should include all original data arguments after the timestamp', () => {
    const formatParams: FormatParams = {
      data: ['User', 42, 'logged in'],
      level: 'info',
      logger: {} as any,
      transport: {} as any,
      message: {
        data: ['User', 42, 'logged in'],
        level: 'info',
        date: new Date('2025-04-17T10:00:00.000Z'),
      },
    };

    const result = logFormatter(formatParams);

    expect(result[0]).toBe('[2025-04-17 12:00:00.000]');
    expect(result.slice(1)).toEqual(['User', 42, 'logged in']);
  });
});
