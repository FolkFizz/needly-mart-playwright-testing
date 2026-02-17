import { APIRequestContext } from '@playwright/test';
import { extractFirstEmailId, extractResetToken } from '@helpers/demo-inbox';

export class DemoInboxApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(box?: 'inbox' | 'trash') {
    return this.request.get('/demo-inbox', {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  async detail(emailId: number, box?: 'inbox' | 'trash') {
    return this.request.get(`/demo-inbox/${emailId}`, {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  async moveToTrash(emailId: number, box: 'inbox' | 'trash' = 'inbox') {
    return this.request.post(`/demo-inbox/${emailId}/delete`, {
      form: { box },
      headers: { Accept: 'text/html' }
    });
  }

  async restore(emailId: number, box: 'inbox' | 'trash' = 'trash') {
    return this.request.post(`/demo-inbox/${emailId}/restore`, {
      form: { box },
      headers: { Accept: 'text/html' }
    });
  }

  async destroy(emailId: number, box: 'inbox' | 'trash' = 'trash') {
    return this.request.post(`/demo-inbox/${emailId}/destroy`, {
      form: { box },
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
