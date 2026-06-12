import { parseContextMenuPath } from './context-menu-pipe';

describe('context menu pipe', () => {
  it('parses an absolute Windows path encoded as UTF-16', () => {
    const message = Buffer.from(String.raw`C:\Users\abc\InternxtDrive\document.pdf`, 'utf16le');

    expect(parseContextMenuPath(message)).toBe(String.raw`C:\Users\abc\InternxtDrive\document.pdf`);
  });

  it.each([
    Buffer.alloc(0),
    Buffer.from('relative-path', 'utf16le'),
    Buffer.from('C:\\valid-path\0ignored', 'utf16le'),
    Buffer.from([0]),
    Buffer.alloc(64 * 1024 + 2),
  ])('rejects an invalid message', (message) => {
    expect(parseContextMenuPath(message)).toBeNull();
  });
});
