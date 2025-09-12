import checkDiskSpace from 'check-disk-space';

const LINUX_BASE_PATH = '/';

export async function getDiskSpace(): Promise<number> {
  try {
    const { size } = await checkDiskSpace(LINUX_BASE_PATH);
    return size;
  } catch (error) {
    return 0;
  }
}
