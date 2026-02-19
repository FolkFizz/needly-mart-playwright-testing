export const extractFirstEmailId = (html: string): number | null => {
  const match = html.match(/inbox-email-item-(\d+)/);
  if (!match) return null;

  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
};

export const extractResetToken = (html: string): string | null => {
  const match = html.match(/\/reset-password\/([a-f0-9]{32,128})/i);
  return match ? match[1] : null;
};

const monthIndex: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

const decodeHtml = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripTags = (value: string): string => value.replace(/<[^>]*>/g, ' ');

export type InboxEmailSummary = {
  id: number;
  subject: string;
  receivedAtMs: number | null;
};

export const parseInboxThailandDateTime = (value: string): number | null => {
  const match = String(value || '').match(
    /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4}),\s+(\d{2}):(\d{2}):(\d{2})/
  );
  if (!match) return null;

  const day = Number.parseInt(match[1], 10);
  const month = monthIndex[String(match[2]).toLowerCase()];
  const year = Number.parseInt(match[3], 10);
  const hour = Number.parseInt(match[4], 10);
  const minute = Number.parseInt(match[5], 10);
  const second = Number.parseInt(match[6], 10);

  if (![day, month, year, hour, minute, second].every(Number.isFinite)) return null;

  // Inbox UI renders timestamps in Thailand time (UTC+7).
  return Date.UTC(year, month, day, hour - 7, minute, second);
};

export const extractInboxEmailSummaries = (html: string): InboxEmailSummary[] => {
  const summaries: InboxEmailSummary[] = [];
  const entryRegex =
    /data-testid="inbox-email-item-(\d+)"[\s\S]*?data-testid="inbox-email-subject-\1">([\s\S]*?)<\/div>[\s\S]*?data-testid="inbox-email-date-\1">([\s\S]*?)<\/div>/g;

  for (const match of html.matchAll(entryRegex)) {
    const id = Number.parseInt(match[1], 10);
    if (!Number.isFinite(id)) continue;

    const subject = decodeHtml(stripTags(String(match[2] || '')).trim());
    const dateText = decodeHtml(stripTags(String(match[3] || '')).trim());

    summaries.push({
      id,
      subject,
      receivedAtMs: parseInboxThailandDateTime(dateText)
    });
  }

  return summaries;
};
