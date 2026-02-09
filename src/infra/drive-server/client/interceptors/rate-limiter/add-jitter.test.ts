import { addJitter } from './add-jitter';

describe('addJitter - spreads retry timing to avoid thundering herd', () => {
  it('should never return less than the base delay', () => {
    const result = addJitter(1000);
    expect(result).toBeGreaterThanOrEqual(1000);
  });

  it('should add up to maxJitter ms on top of the base delay', () => {
    const result = addJitter(1000, 200);
    expect(result).toBeGreaterThanOrEqual(1000);
    expect(result).toBeLessThan(1200);
  });

  it(' should default maxJitter to 100ms', () => {
    const result = addJitter(500);
    expect(result).toBeGreaterThanOrEqual(500);
    expect(result).toBeLessThan(600);
  });

  it('should add no jitter when randomness is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(addJitter(1000, 200)).toBe(1000);
  });

  it('should add the maximum jitter when randomness is near 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(addJitter(1000, 100)).toBe(1099);
  });

  it('should return the base delay exactly when maxJitter is 0', () => {
    expect(addJitter(500, 0)).toBe(500);
  });

  it('should work with a base delay of 0', () => {
    const result = addJitter(0, 50);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(50);
  });
});
