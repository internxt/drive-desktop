import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { hasToBeMoved } from './has-to-be-moved';
import { mockProps } from '@/tests/vitest/utils.helper.test';

describe('has-to-be-moved', () => {
  let props: Parameters<typeof hasToBeMoved>[0];

  beforeEach(() => {
    props = mockProps<typeof hasToBeMoved>({});
  });

  it('should return false if path is the same', () => {
    // Given
    props.remotePath = abs('/parent2/parent1/current');
    props.localPath = abs('/parent2/parent1/current');
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if item is renamed', () => {
    // Given
    props.remotePath = abs('/parent2/parent1/old');
    props.localPath = abs('/parent2/parent1/new');
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if parent is moved', () => {
    // Given
    props.remotePath = abs('/parent2/old/current');
    props.localPath = abs('/parent2/new/current');
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if item is renamed and parent is moved', () => {
    // Given
    props.remotePath = abs('/parent2/old/old');
    props.localPath = abs('/parent2/new/new');
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  it('should return false if gran parent is moved', () => {
    // Given
    props.remotePath = abs('/old/old/old');
    props.localPath = abs('/new/new/new');
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });
});
