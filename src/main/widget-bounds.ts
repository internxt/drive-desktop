const bounds: Record<
  string,
  { width: number; height: number; placeUnderTray: boolean }
> = {
  '/': { width: 330, height: 392, placeUnderTray: true },
  '/login': { width: 300, height: 474, placeUnderTray: false },
};

export default bounds;
