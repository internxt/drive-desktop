export function formatBytes(bytes: number) {
  const gb = bytes / 1024 ** 3;

  if (Number.isInteger(gb)) {
    return `${gb}GB`;
  }

  return `${gb.toFixed(1)}GB`;
}
