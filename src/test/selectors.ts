import { Page } from 'playwright';

const screenshot = async (page: Page, name: string): Promise<void> => {
  const opts = {
    fullPage: true,
    path: `./src/test/screenshots/${name}.png`,
  };

  await page.screenshot(opts);
};

export const getWindowTopBarTitle = async (
  page: Page
): Promise<string | null> => {
  const content = await page
    .locator('[data-test=window-top-bar-title]')
    .textContent();

  if (!content) {
    await screenshot(page, 'window-top-bar-title');
  }

  return content;
};
