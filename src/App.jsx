import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_API_URL = 'https://api.green-api.com/v3';

const ICONS = {
  add: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="m5 12 14-7-4 14-3-5-7-2Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  message: <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48A8.55 8.55 0 0 1 8.5 18L4 20l1.4-4.2A7.5 7.5 0 1 1 20 11.5Z" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.13 2.13-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20.3H11.3v-.08A1.7 1.7 0 0 0 10.27 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.13-2.13.06-.06A1.7 1.7 0 0 0 6.6 15a1.7 1.7 0 0 0-1.55-1.03H5v-3h.05A1.7 1.7 0 0 0 6.6 9.94a1.7 1.7 0 0 0-.34-1.88L6.2 8 8.33 5.87l.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.3 4.72V4.6h3.4v.12a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03H21v3h-.05A1.7 1.7 0 0 0 19.4 15Z" /></>,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.2s1.1 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01" /></>,
};

function Icon({ name, size = 20 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

function avatarLetters(value = '') {
  const cleaned = value.replace(/@.*$/, '').replace(/\D/g, '');
  return cleaned ? cleaned.slice(-2) : 'M';
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatChatId(value) {
  const trimmed = value.trim();
  if (trimmed.includes('@')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `${digits}@c.us` : '';
}

function messageFromNotification(notification) {
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

async function readApiResponse(response) {
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

function apiUrl(credentials, method, receiptId) {
  const base = credentials.apiUrl.replace(/\/+$/, '');
  const id = encodeURIComponent(credentials.idInstance.trim());
  const token = encodeURIComponent(credentials.apiTokenInstance.trim());
  const suffix = receiptId === undefined ? '' : `/${encodeURIComponent(receiptId)}`;
  return `${base}/waInstance${id}/${method}/${token}${suffix}`;
}

export default function App() {
  const [credentials, setCredentials] = useState(null);
  const [credentialDraft, setCredentialDraft] = useState({
    apiUrl: DEFAULT_API_URL,
    idInstance: '',
    apiTokenInstance: '',
  });
  const [showSettings, setShowSettings] = useState(true);
  const [recipient, setRecipient] = useState('');
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connectionState, setConnectionState] = useState('not-connected');
  const [notice, setNotice] = useState(null);
  const messageEndRef = useRef(null);
  const seenNotificationIds = useRef(new Set());

  const activeMessages = useMemo(
    () => messages.filter((message) => !chat || message.chatId === chat.id),
    [chat, messages],
  );

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, chat]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!credentials) return undefined;

    let stopped = false;
    let controller;
    let timer;

    const schedule = (delay = 800) => {
      if (!stopped) timer = window.setTimeout(receiveNextNotification, delay);
    };

    const receiveNextNotification = async () => {
      controller = new AbortController();
      try {
        const response = await fetch(`${apiUrl(credentials, 'receiveNotification')}?receiveTimeout=5`, {
          signal: controller.signal,
        });
        const notification = await readApiResponse(response);

        if (!notification || !notification.receiptId || stopped) {
          setConnectionState('connected');
          schedule();
          return;
        }

        const incomingMessage = messageFromNotification(notification);
        if (incomingMessage && !seenNotificationIds.current.has(incomingMessage.id)) {
          seenNotificationIds.current.add(incomingMessage.id);
          setMessages((previous) => [...previous, incomingMessage]);
        }

        await fetch(apiUrl(credentials, 'deleteNotification', notification.receiptId), {
          method: 'DELETE',
          signal: controller.signal,
        });
        setConnectionState('connected');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setConnectionState('warning');
          setNotice({ type: 'warning', text: `Receiving messages was temporarily interrupted: ${error.message}` });
        }
      } finally {
        schedule(connectionState === 'warning' ? 5000 : 800);
      }
    };

    receiveNextNotification();
    return () => {
      stopped = true;
      controller?.abort();
      window.clearTimeout(timer);
    };
  }, [credentials]);

  const saveCredentials = async (event) => {
    event.preventDefault();
    if (!credentialDraft.idInstance.trim() || !credentialDraft.apiTokenInstance.trim()) {
      setNotice({ type: 'error', text: 'Fill in the idInstance and apiTokenInstance fields.' });
      return;
    }

    const nextCredentials = {
      ...credentialDraft,
      apiUrl: credentialDraft.apiUrl.trim() || DEFAULT_API_URL,
    };

    setIsVerifying(true);
    try {
      const response = await fetch(apiUrl(nextCredentials, 'getStateInstance'));
      const state = await readApiResponse(response);
      setCredentials(nextCredentials);
      setConnectionState('connecting');
      setShowSettings(false);
      const isAuthorized = state?.stateInstance === 'authorized';
      setNotice({
        type: isAuthorized ? 'success' : 'warning',
        text: isAuthorized
          ? 'Connection verified. Incoming messages are being received.'
          : `The API details are correct, but the instance status is: ${state?.stateInstance || 'unknown'}.`,
      });
    } catch (error) {
      setConnectionState('not-connected');
      setNotice({ type: 'error', text: `Unable to connect: ${error.message}` });
    } finally {
      setIsVerifying(false);
    }
  };

  const createChat = (event) => {
    event.preventDefault();
    const id = formatChatId(recipient);
    if (!id) {
      setNotice({ type: 'error', text: 'Enter the recipient’s phone number or chat ID.' });
      return;
    }

    setChat({ id, label: recipient.trim() || id });
    setRecipient('');
    setNotice({ type: 'success', text: 'New chat opened.' });
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!credentials || !chat || !text || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(apiUrl(credentials, 'sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, message: text }),
      });
      const data = await readApiResponse(response);
      setMessages((previous) => [
        ...previous,
        {
          id: data?.idMessage || window.crypto?.randomUUID?.() || `${Date.now()}`,
          chatId: chat.id,
          text,
          direction: 'outgoing',
          createdAt: new Date(),
        },
      ]);
      setDraft('');
    } catch (error) {
      setNotice({ type: 'error', text: `Message was not sent: ${error.message}` });
    } finally {
      setIsSending(false);
    }
  };

  const disconnect = () => {
    setCredentials(null);
    setChat(null);
    setMessages([]);
    setDraft('');
    setConnectionState('not-connected');
    seenNotificationIds.current.clear();
    setShowSettings(true);
    setNotice({ type: 'success', text: 'Disconnected. Data was not saved in the browser.' });
  };

  const statusText = {
    'not-connected': 'Disconnected',
    connecting: 'Connecting',
    connected: 'Online',
    warning: 'Checking',
  }[connectionState];

  return (
    <main className="app-shell">
      <section className="chat-window" aria-label="MAX chat">
        <aside className="sidebar">
          <div className="brand-row">
            <div className="max-logo" aria-label="MAX">MAX</div>
            <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Settings">
              <Icon name="settings" />
            </button>
          </div>

          <div className="account-card">
            <span className={`status-dot ${connectionState}`} />
            <div>
              <strong>{statusText}</strong>
              <span>{credentials ? 'Via GREEN-API' : 'Enter API settings'}</span>
            </div>
          </div>

          <form className="new-chat" onSubmit={createChat}>
            <label htmlFor="recipient">New chat</label>
            <div className="recipient-input">
              <Icon name="search" size={18} />
              <input
                id="recipient"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Phone number or chat ID"
                disabled={!credentials}
              />
              <button className="small-add" type="submit" disabled={!credentials} aria-label="Open chat">
                <Icon name="add" size={18} />
              </button>
            </div>
          </form>

          <div className="conversations-heading">
            <span>CHATS</span>
            {chat && <span className="count">1</span>}
          </div>
          <div className="conversation-list">
            {chat ? (
              <button className="conversation active" onClick={() => setChat(chat)}>
                <span className="avatar">{avatarLetters(chat.label)}</span>
                <span className="conversation-copy">
                  <strong>{chat.label}</strong>
                  <small>{activeMessages.at(-1)?.text || 'Start typing a message'}</small>
                </span>
                <small className="conversation-time">{activeMessages.at(-1) ? formatTime(activeMessages.at(-1).createdAt) : ''}</small>
              </button>
            ) : (
              <div className="empty-list">
                <span className="empty-icon"><Icon name="message" size={20} /></span>
                <p>No chats yet</p>
                <small>Enter a number to start a new chat.</small>
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <Icon name="lock" size={15} /> Token is available only in this session
          </div>
        </aside>

        <section className="conversation-panel">
          {chat ? (
            <>
              <header className="chat-header">
                <span className="avatar large">{avatarLetters(chat.label)}</span>
                <div className="chat-person">
                  <h1>{chat.label}</h1>
                  <p><span className={`status-dot ${connectionState}`} /> {connectionState === 'connected' ? 'Receiving messages' : statusText}</p>
                </div>
                <button className="icon-button muted" aria-label="More actions"><Icon name="dots" /></button>
              </header>

              <div className="messages" aria-live="polite">
                <div className="day-label"><span>TODAY</span></div>
                {activeMessages.length === 0 && (
                  <div className="message-hint">
                    <Icon name="message" size={22} />
                    <p>Conversation started</p>
                    <small>Your message will be sent through GREEN-API.</small>
                  </div>
                )}
                {activeMessages.map((message) => (
                  <article key={message.id} className={`bubble ${message.direction}`}>
                    <p>{message.text}</p>
                    <span className="message-meta">{formatTime(message.createdAt)} {message.direction === 'outgoing' && <Icon name="check" size={14} />}</span>
                  </article>
                ))}
                <div ref={messageEndRef} />
              </div>

              <form className="composer" onSubmit={sendMessage}>
                <button type="button" className="icon-button muted" aria-label="Emoji"><Icon name="smile" /></button>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message..."
                  maxLength="20000"
                  disabled={!credentials || isSending}
                />
                <button className="send-button" type="submit" disabled={!draft.trim() || isSending || !credentials} aria-label="Send">
                  <Icon name="arrow" size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="welcome-panel">
              <div className="welcome-mark"><span>MAX</span></div>
              <h1>MAX chat</h1>
              <p>Send messages through GREEN-API and view incoming replies here.</p>
              {credentials ? (
                <form className="welcome-new-chat" onSubmit={createChat}>
                  <input
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    placeholder="Phone number or chat ID"
                    aria-label="Recipient phone number or chat ID"
                  />
                  <button className="primary-button" type="submit"><Icon name="add" size={18} /> Open chat</button>
                </form>
              ) : (
                <button className="primary-button" onClick={() => setShowSettings(true)}>
                  <Icon name="settings" size={18} /> Connect GREEN-API
                </button>
              )}
            </div>
          )}
        </section>
      </section>

      {showSettings && (
        <div className="modal-backdrop" role="presentation">
          <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <button className="modal-close" onClick={() => setShowSettings(false)} aria-label="Close"><Icon name="close" /></button>
            <div className="modal-mark"><Icon name="lock" size={20} /></div>
            <h2 id="settings-title">GREEN-API connection</h2>
            <p>Your data is not saved. Enter the API URL and token for this exact instance in the MAX console.</p>
            <form onSubmit={saveCredentials}>
              <label>
                API URL
                <input
                  value={credentialDraft.apiUrl}
                  onChange={(event) => setCredentialDraft((previous) => ({ ...previous, apiUrl: event.target.value }))}
                  placeholder={DEFAULT_API_URL}
                  inputMode="url"
                />
              </label>
              <label>
                idInstance
                <input
                  value={credentialDraft.idInstance}
                  onChange={(event) => setCredentialDraft((previous) => ({ ...previous, idInstance: event.target.value }))}
                  placeholder="1101XXXXXXXX"
                  autoComplete="off"
                />
              </label>
              <label>
                apiTokenInstance
                <input
                  type="password"
                  value={credentialDraft.apiTokenInstance}
                  onChange={(event) => setCredentialDraft((previous) => ({ ...previous, apiTokenInstance: event.target.value }))}
                  placeholder="Your API token"
                  autoComplete="new-password"
                />
              </label>
              <button className="primary-button full" type="submit" disabled={isVerifying}>
                <Icon name="check" size={18} /> {isVerifying ? 'Checking...' : 'Verify connection'}
              </button>
            </form>
            {credentials && <button className="disconnect-button" type="button" onClick={disconnect}>Disconnect</button>}
            <small className="modal-help">Copy the <strong>apiUrl</strong>, <strong>idInstance</strong>, and <strong>apiTokenInstance</strong> values from the same instance in the console.</small>
          </section>
        </div>
      )}

      {notice && (
        <div className={`toast ${notice.type}`} role="status">
          <span>{notice.type === 'success' ? <Icon name="check" size={18} /> : <Icon name="close" size={18} />}</span>
          {notice.text}
        </div>
      )}
    </main>
  );
}
