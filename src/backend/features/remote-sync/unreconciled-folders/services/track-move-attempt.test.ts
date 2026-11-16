import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { clearMoveAttempts } from './clear-move-attempts';
import { trackMoveAttempt } from './track-move-attempt';

describe('track-move-attempt', () => {
  const uuid = 'uuid';

  beforeEach(() => {
    clearMoveAttempts({ uuid });
  });

  it('should count consecutive attempts of the same move', () => {
    // Given
    const move = { uuid, from: abs('/root/folder'), to: abs('/root/renamed') };
    // When
    const attempts = [trackMoveAttempt(move), trackMoveAttempt(move), trackMoveAttempt(move)];
    // Then
    expect(attempts).toStrictEqual([{ attempts: 1 }, { attempts: 2 }, { attempts: 3 }]);
  });

  it('should start over when the destination changes because it is a new move', () => {
    // Given
    trackMoveAttempt({ uuid, from: abs('/root/folder'), to: abs('/root/renamed') });
    // When
    const { attempts } = trackMoveAttempt({ uuid, from: abs('/root/folder'), to: abs('/root/other') });
    // Then
    expect(attempts).toBe(1);
  });

  it('should start over when the origin changes because the previous move worked', () => {
    // Given
    trackMoveAttempt({ uuid, from: abs('/root/folder'), to: abs('/root/renamed') });
    // When
    const { attempts } = trackMoveAttempt({ uuid, from: abs('/root/renamed'), to: abs('/root/renamed again') });
    // Then
    expect(attempts).toBe(1);
  });

  it('should track each item separately', () => {
    // Given
    trackMoveAttempt({ uuid, from: abs('/root/folder'), to: abs('/root/renamed') });
    // When
    const { attempts } = trackMoveAttempt({ uuid: 'other', from: abs('/root/folder'), to: abs('/root/renamed') });
    // Then
    expect(attempts).toBe(1);
    clearMoveAttempts({ uuid: 'other' });
  });
});
