import { getDimensions } from './get-dimensions';

describe('get-dimensions', () => {
  it('should calculate dimensions', () => {
    // When
    const { positions, bounds } = getDimensions({
      workArea: { width: 1000, height: 800 },
      dimensions: { width: 500, height: 200 },
    });
    // Then
    expect(positions).toStrictEqual({ x: 250, y: 300 });
    expect(bounds).toStrictEqual({ left: 0, top: 0, right: 500, bottom: 600 });
  });
});
