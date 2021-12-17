export function truncatePath(path, maxLength) {
  if (path.length <= maxLength) { return path }

  const separator = '[...]'
  const sliceSize = (maxLength - separator.length) / 2

  const firstSlice = path.slice(0, sliceSize)
  const secondSlice = path.slice(-sliceSize)

  return `${firstSlice}${separator}${secondSlice}`
}
