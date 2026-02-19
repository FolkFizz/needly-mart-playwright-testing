import { APIRequestContext } from '@playwright/test';
import { extractFirstEmailId, extractInboxEmailSummaries, extractResetToken } from '@helpers/demo-inbox';

type InboxBox = 'inbox' | 'trash';

type RecipientIdentity = {
  username: string;
  password: string;
  email?: string;
};

type ResetTokenReadOptions = {
  subjectIncludes?: string;
  requestedAtMs?: number;
  timeWindowMs?: number;
  attempts?: number;
  pollDelayMs?: number;
  recipient?: RecipientIdentity;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value: string): string => String(value || '').trim().toLowerCase();

export class DemoInboxApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async list(box?: InboxBox) {
    return this.request.get('/demo-inbox', {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  async detail(emailId: number, box?: InboxBox) {
    return this.request.get(`/demo-inbox/${emailId}`, {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  async moveToTrash(emailId: number, box: InboxBox = 'inbox') {
    return this.request.post(`/demo-inbox/${emailId}/delete`, {
      form: { box },
      headers: { Accept: 'text/html' }
    });
  }

  async restore(emailId: number, box: InboxBox = 'trash') {
    return this.request.post(`/demo-inbox/${emailId}/restore`, {
      form: { box },
      headers: { Accept: 'text/html' }
    });
  }

  async destroy(emailId: number, box: InboxBox = 'trash') {
    return this.request.post(`/demo-inbox/${emailId}/destroy`, {
      form: { box },
      headers: { Accept: 'text/html' }
    });
  }

  private async listPrivateInbox(box?: InboxBox) {
    return this.request.get('/inbox', {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  private async detailPrivateInbox(emailId: number, box?: InboxBox) {
    return this.request.get(`/inbox/${emailId}`, {
      params: box ? { box } : undefined,
      headers: { Accept: 'text/html' }
    });
  }

  private async loginAs(identity: RecipientIdentity) {
    return this.request.post('/api/auth/login', {
      data: {
        username: identity.username,
        password: identity.password
      },
      headers: { Accept: 'application/json' }
    });
  }

  private async logoutIfNeeded() {
    await this.request.post('/api/auth/logout', {
      headers: { Accept: 'application/json' }
    }).catch(() => undefined);
  }

  async readLatestResetToken(options: ResetTokenReadOptions = {}) {
    const subjectIncludes = normalize(options.subjectIncludes || '[RESET]');
    const attempts = options.attempts ?? 8;
    const pollDelayMs = options.pollDelayMs ?? 1_000;
    const timeWindowMs = options.timeWindowMs ?? 120_000;
    const requestedAtMs = options.requestedAtMs ?? Date.now();
    const fromMs = requestedAtMs - 1_000;
    const deadlineMs = requestedAtMs + timeWindowMs;
    const usePrivateInbox = Boolean(options.recipient?.username && options.recipient?.password);

    if (usePrivateInbox) {
      const loginResponse = await this.loginAs(options.recipient as RecipientIdentity);
      if (loginResponse.status() !== 200) {
        throw new Error(
          `Unable to authenticate for recipient-specific inbox lookup. Status: ${loginResponse.status()}`
        );
      }
    }

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const inboxList = usePrivateInbox ? await this.listPrivateInbox() : await this.list();
      if (inboxList.status() !== 200) {
        if (attempt === attempts) {
          if (usePrivateInbox) await this.logoutIfNeeded();
          throw new Error(
            `Failed to fetch ${usePrivateInbox ? 'private' : 'demo'} inbox list. Status: ${inboxList.status()}`
          );
        }
        await delay(pollDelayMs);
        continue;
      }

      const summaries = extractInboxEmailSummaries(await inboxList.text());
      const candidates = summaries
        .filter((summary) => normalize(summary.subject).includes(subjectIncludes))
        .filter((summary) => {
          if (summary.receivedAtMs === null) return true;
          return summary.receivedAtMs >= fromMs && summary.receivedAtMs <= deadlineMs;
        })
        .sort((a, b) => b.id - a.id);

      for (const email of candidates) {
        const emailDetail = usePrivateInbox
          ? await this.detailPrivateInbox(email.id)
          : await this.detail(email.id);

        if (emailDetail.status() !== 200) continue;

        const detailHtml = await emailDetail.text();
        const resetToken = extractResetToken(detailHtml);
        if (!resetToken) continue;

        if (options.recipient?.email) {
          const lowerEmail = normalize(options.recipient.email);
          if (lowerEmail && !normalize(detailHtml).includes(lowerEmail)) {
            // For current Needly inbox templates reset bodies do not include recipient email.
            // Keep token when mailbox itself is already recipient-scoped (private inbox mode).
            if (!usePrivateInbox) continue;
          }
        }

        if (usePrivateInbox) await this.logoutIfNeeded();
        return resetToken;
      }

      if (attempt < attempts) await delay(pollDelayMs);
    }

    if (usePrivateInbox) await this.logoutIfNeeded();

    const scope = usePrivateInbox
      ? `private inbox for ${options.recipient?.username}`
      : 'demo inbox';
    throw new Error(
      `No matching reset token found in ${scope} (subject="${subjectIncludes}", requestedAt=${requestedAtMs}, windowMs=${timeWindowMs}).`
    );
  }

  async readFirstEmailId(box: InboxBox = 'inbox') {
    const inboxList = await this.list(box);
    if (inboxList.status() !== 200) {
      throw new Error(`Failed to fetch demo inbox list. Status: ${inboxList.status()}`);
    }

    const emailId = extractFirstEmailId(await inboxList.text());
    if (!emailId) {
      throw new Error('No inbox email id found in demo inbox list.');
    }

    return emailId;
  }
}
