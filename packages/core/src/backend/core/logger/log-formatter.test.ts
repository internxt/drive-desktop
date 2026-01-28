import { FormatParams } from 'electron-log';

import { mockProps } from '@/tests/vitest/utils.helper.test';

import { logFormatter } from './log-formatter';

describe('logFormatter', () => {
  it('should include GMT+2 formatted timestamp and message data', () => {
    const formatParams: FormatParams = mockProps<typeof logFormatter>({
      data: ['App started'],
      level: 'info',
      message: {
        data: ['App started'],
        level: 'info',
        date: new Date('2025-04-17T12:00:00.000Z'),
      },
    });
    const result = logFormatter(formatParams);

    expect(result[0]).toBe('[2025-04-17 14:00:00.000]');
    expect(result.slice(1)).toStrictEqual(['App started']);
  });

  it('should include all original data arguments after the timestamp', () => {
    const formatParams: FormatParams = mockProps<typeof logFormatter>({
      data: ['User', 42, 'logged in'],
      level: 'info',
      message: {
        data: ['User', 42, 'logged in'],
        level: 'info',
        date: new Date('2025-04-17T10:00:00.000Z'),
      },
    });

    const result = logFormatter(formatParams);

    expect(result[0]).toBe('[2025-04-17 12:00:00.000]');
    expect(result.slice(1)).toStrictEqual(['User', 42, 'logged in']);
  });
});
