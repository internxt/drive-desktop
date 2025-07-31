import { convertUTCDateToGMT2 } from './convert-UTC-date-to-GMT2';

describe('convertUTCDateToGMT2', () => {
  it('should return a string in the format YYYY-MM-DD HH:mm:SS.SSS', () => {
    const result = convertUTCDateToGMT2(new Date());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it('should correctly convert a specific UTC date to GMT+2', () => {
    const input = new Date('2025-04-17T12:00:00.000Z'); // UTC
    const result = convertUTCDateToGMT2(input);
    expect(result).toBe('2025-04-17 14:00:00.000'); // +2h
  });

  it('should correctly convert and preserve milliseconds', () => {
    const input = new Date('2025-04-17T23:59:59.987Z');
    const result = convertUTCDateToGMT2(input);
    expect(result).toBe('2025-04-18 01:59:59.987');
  });

  it('should correctly handle dates near midnight UTC', () => {
    const date = new Date('2025-04-17T23:30:00.000Z'); // UTC
    const result = convertUTCDateToGMT2(date);
    expect(result).toBe('2025-04-18 01:30:00.000'); // next day in GMT+2
  });
});
