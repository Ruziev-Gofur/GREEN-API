import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationPanel from './components/ConversationPanel';
import SettingsModal from './components/SettingsModal';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import {
  apiUrl,
  DEFAULT_API_URL,
  formatChatId,
  messageFromNotification,
  readApiResponse,
} from './utils/chat';

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
      let nextPollDelay = 800;
      controller = new AbortController();
      try {
        const response = await fetch(`${apiUrl(credentials, 'receiveNotification')}?receiveTimeout=5`, {
          signal: controller.signal,
        });
        const notification = await readApiResponse(response);

        if (!notification || !notification.receiptId || stopped) {
          setConnectionState('connected');
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
          nextPollDelay = 5000;
        }
      } finally {
        schedule(nextPollDelay);
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
        <Sidebar
          activeMessages={activeMessages}
          chat={chat}
          connectionState={connectionState}
          credentials={credentials}
          onCreateChat={createChat}
          onOpenSettings={() => setShowSettings(true)}
          onRecipientChange={setRecipient}
          onSelectChat={() => setChat(chat)}
          recipient={recipient}
          statusText={statusText}
        />
        <ConversationPanel
          activeMessages={activeMessages}
          chat={chat}
          connectionState={connectionState}
          credentials={credentials}
          draft={draft}
          isSending={isSending}
          messageEndRef={messageEndRef}
          onCreateChat={createChat}
          onDraftChange={setDraft}
          onOpenSettings={() => setShowSettings(true)}
          onRecipientChange={setRecipient}
          onSendMessage={sendMessage}
          recipient={recipient}
          statusText={statusText}
        />
      </section>

      {showSettings && (
        <SettingsModal
          credentialDraft={credentialDraft}
          credentials={credentials}
          isVerifying={isVerifying}
          onClose={() => setShowSettings(false)}
          onDisconnect={disconnect}
          onDraftChange={setCredentialDraft}
          onSubmit={saveCredentials}
        />
      )}

      <Toast notice={notice} />
    </main>
  );
}
