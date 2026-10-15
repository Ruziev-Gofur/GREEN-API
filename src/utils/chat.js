export const DEFAULT_API_URL = 'https://api.green-api.com/v3';

export function avatarLetters(value = '') {
  const cleaned = value.replace(/@.*$/, '').replace(/\D/g, '');
  return cleaned ? cleaned.slice(-2) : 'M';
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function formatChatId(value) {
  const trimmed = value.trim();
  if (trimmed.includes('@')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `${digits}@c.us` : '';
}

export function messageFromNotification(notification) {
  const body = notification?.body ?? notification;
  const data = body?.messageData ?? {};
  const text =
    data?.textMessageData?.textMessage ||
    data?.extendedTextMessageData?.text ||
    data?.extendedTextMessageData?.textMessage ||
    data?.textMessage ||
    '';

  if (!text) return null;

  return {
    id: body?.idMessage || `${notification.receiptId}-${Date.now()}`,
    chatId: body?.senderData?.chatId || body?.chatId || '',
    text,
    direction: 'incoming',
    createdAt: new Date(),
  };
}

export async function readApiResponse(response) {
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('GREEN-API 401: idInstance, apiTokenInstance, or API URL is invalid');
    }
    const message = typeof data === 'object' && data ? data.message || data.error || JSON.stringify(data) : raw;
    throw new Error(message || `Request failed (${response.status})`);
  }

  return data;
}

export function apiUrl(credentials, method, receiptId) {
  const base = credentials.apiUrl.replace(/\/+$/, '');
  const id = encodeURIComponent(credentials.idInstance.trim());
  const token = encodeURIComponent(credentials.apiTokenInstance.trim());
  const suffix = receiptId === undefined ? '' : `/${encodeURIComponent(receiptId)}`;
  return `${base}/waInstance${id}/${method}/${token}${suffix}`;
}
