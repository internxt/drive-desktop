import { CleanerContext } from '../types/cleaner.types';

type Props = {
  ctx: CleanerContext;
  fileName: string;
};

export function isSafeWebBrowserFile({ ctx, fileName }: Props) {
  const lowerName = fileName.toLowerCase();

  return !(ctx.browser.criticalExtensions.some((ext) => lowerName.endsWith(ext)) || ctx.browser.criticalFilenames.includes(lowerName));
}
