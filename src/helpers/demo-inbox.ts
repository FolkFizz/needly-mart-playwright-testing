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
