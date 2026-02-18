import { expect, Page } from '@playwright/test';

type OverflowMetrics = {
  viewportWidth: number;
  docScrollWidth: number;
  bodyScrollWidth: number;
  docOverflowX: number;
  bodyOverflowX: number;
};

const getOverflowMetrics = async (page: Page): Promise<OverflowMetrics> =>
  page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const docScrollWidth = Math.ceil(doc.scrollWidth);
    const bodyScrollWidth = body ? Math.ceil(body.scrollWidth) : 0;

    return {
      viewportWidth: Math.ceil(viewportWidth),
      docScrollWidth,
      bodyScrollWidth,
      docOverflowX: Math.max(0, docScrollWidth - Math.ceil(viewportWidth)),
      bodyOverflowX: Math.max(0, bodyScrollWidth - Math.ceil(viewportWidth))
    };
  });

export const assertNoHorizontalOverflow = async (page: Page, tolerancePx = 4): Promise<void> => {
  const metrics = await getOverflowMetrics(page);

  expect(
    metrics.docOverflowX,
    `Document horizontal overflow is ${metrics.docOverflowX}px (viewport=${metrics.viewportWidth}, doc=${metrics.docScrollWidth})`
  ).toBeLessThanOrEqual(tolerancePx);

  expect(
    metrics.bodyOverflowX,
    `Body horizontal overflow is ${metrics.bodyOverflowX}px (viewport=${metrics.viewportWidth}, body=${metrics.bodyScrollWidth})`
  ).toBeLessThanOrEqual(tolerancePx);
};

export const setTextZoom = async (page: Page, zoomPercent: number): Promise<void> => {
  await page.evaluate((percent) => {
    const styleId = 'qa-mobile-text-zoom-style';
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `html { font-size: ${percent}% !important; }`;
  }, zoomPercent);
};
