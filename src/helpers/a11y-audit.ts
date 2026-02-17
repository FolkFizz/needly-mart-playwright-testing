import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

export class A11yAudit {
  constructor(private readonly page: Page) {}

  async assertNoCriticalOrSerious() {
    const result = await new AxeBuilder({ page: this.page }).analyze();
    const blockers = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
  }
}
