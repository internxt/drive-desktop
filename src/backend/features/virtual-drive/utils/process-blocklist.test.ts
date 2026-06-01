import { describe, it, expect } from 'vitest';
import { isBlocklistedProcess } from './process-blocklist';

describe('isBlocklistedProcess', () => {
  it('should block pool-org.gnome (Nautilus thumbnail generation)', () => {
    expect(isBlocklistedProcess('pool-org.gnome')).toBe(true);
  });

  it('should block pool-org.gnome. with trailing dot (kernel 16-char truncation variant)', () => {
    expect(isBlocklistedProcess('pool-org.gnome.')).toBe(true);
  });

  it('should not block pool-gnome-text (GNOME Text Editor user open)', () => {
    expect(isBlocklistedProcess('pool-gnome-text')).toBe(false);
  });

  it('should not block vlc (user-initiated open)', () => {
    expect(isBlocklistedProcess('vlc')).toBe(false);
  });

  it('should not block evince (user-initiated open)', () => {
    expect(isBlocklistedProcess('evince')).toBe(false);
  });

  it('should not block empty string (unknown process defaults to allow)', () => {
    expect(isBlocklistedProcess('')).toBe(false);
  });

  it('should not block nautilus (file manager process itself is not the thumbnail daemon)', () => {
    expect(isBlocklistedProcess('nautilus')).toBe(false);
  });
});
