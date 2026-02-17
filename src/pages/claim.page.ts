import { Page, expect } from '@playwright/test';
import { ROUTE } from '@config/routes';
import { TEST_ID } from '@selectors/test-ids';

export class ClaimPage {
  constructor(private readonly page: Page) {}

  async gotoClaim() {
    await this.page.goto(ROUTE.claim);
    await expect(this.page.getByTestId(TEST_ID.claim.page)).toBeVisible();
  }

  async fillInvoiceId(invoiceId: string) {
    await this.page.getByTestId(TEST_ID.claim.invoiceIdInput).fill(invoiceId);
  }

  async fillDescription(description: string) {
    await this.page.getByTestId(TEST_ID.claim.descriptionInput).fill(description);
  }

  async uploadImageEvidence(fileName = 'claim-proof.png') {
    await this.page.getByTestId(TEST_ID.claim.imageInput).setInputFiles({
      name: fileName,
      mimeType: 'image/png',
      buffer: Buffer.from('89504E470D0A1A0A', 'hex')
    });
  }

  async uploadInvalidEvidenceFile() {
    await this.page.getByTestId(TEST_ID.claim.imageInput).setInputFiles({
      name: 'invalid-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid evidence payload')
    });
  }

  async submit() {
    await this.page.getByTestId(TEST_ID.claim.submitBtn).click();
  }

  async submitClaim(invoiceId: string, description: string) {
    await this.fillInvoiceId(invoiceId);
    await this.fillDescription(description);
    await this.submit();
  }

  async assertErrorContains(message: string) {
    await expect(this.page.getByTestId(TEST_ID.claim.error)).toContainText(message);
  }
}
