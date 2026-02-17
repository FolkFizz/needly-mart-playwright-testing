import { APIRequestContext } from '@playwright/test';
import { extractFirstEmailId, extractResetToken } from '@helpers/demo-inbox';

export class DemoInboxApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async list() {
    return this.request.get('/demo-inbox', {
      headers: { Accept: 'text/html' }
    });
  }

  async detail(emailId: number) {
    return this.request.get(`/demo-inbox/${emailId}`, {
      headers: { Accept: 'text/html' }
    });
  }

  async readLatestResetToken() {
    const inboxList = await this.list();
    if (inboxList.status() !== 200) {
      throw new Error(`Failed to fetch demo inbox list. Status: ${inboxList.status()}`);
    }

    const emailId = extractFirstEmailId(await inboxList.text());
    if (!emailId) {
      throw new Error('No inbox email id found in demo inbox list.');
    }

    const emailDetail = await this.detail(emailId);
    if (emailDetail.status() !== 200) {
      throw new Error(`Failed to fetch demo inbox email detail. Status: ${emailDetail.status()}`);
    }

    const resetToken = extractResetToken(await emailDetail.text());
    if (!resetToken) {
      throw new Error('No reset token found in demo inbox email detail.');
    }

    return resetToken;
  }
}
