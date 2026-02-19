export type Dimensions = { width: number; height: number };

export const SETTINGS: Dimensions = { width: 750, height: 600 };
export const ISSUES: Dimensions = { width: 600, height: 484 };
export const AUTH: Dimensions = { width: 520, height: 320 };

type Props = {
  workArea: Dimensions;
  dimensions: Dimensions;
};

export function getDimensions({ workArea, dimensions }: Props) {
  const positions = {
    x: workArea.width / 2 - dimensions.width / 2,
    y: workArea.height / 2 - dimensions.height / 2,
  };

  const bounds = {
    left: 0,
    top: 0,
    right: workArea.width - dimensions.width,
    bottom: workArea.height - 100,
  };

  return { positions, bounds };
}
