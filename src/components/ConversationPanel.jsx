import Icon from './Icon';
import { avatarLetters, formatTime } from '../utils/chat';

function WelcomePanel({ credentials, onCreateChat, onOpenSettings, onRecipientChange, recipient }) {
  return (
    <div className="welcome-panel">
      <div className="welcome-mark"><span>MAX</span></div>
      <h1>MAX chat</h1>
      <p>Send messages through GREEN-API and view incoming replies here.</p>
      {credentials ? (
        <form className="welcome-new-chat" onSubmit={onCreateChat}>
          <input
            value={recipient}
            onChange={(event) => onRecipientChange(event.target.value)}
            placeholder="Phone number or chat ID"
            aria-label="Recipient phone number or chat ID"
          />
          <button className="primary-button" type="submit"><Icon name="add" size={18} /> Open chat</button>
        </form>
      ) : (
        <button className="primary-button" onClick={onOpenSettings}>
          <Icon name="settings" size={18} /> Connect GREEN-API
        </button>
      )}
    </div>
  );
}

export default function ConversationPanel({
  activeMessages,
  chat,
  connectionState,
  credentials,
  draft,
  isSending,
  messageEndRef,
  onCreateChat,
  onDraftChange,
  onOpenSettings,
  onRecipientChange,
  onSendMessage,
  recipient,
  statusText,
}) {
  if (!chat) {
    return (
      <section className="conversation-panel">
        <WelcomePanel
          credentials={credentials}
          onCreateChat={onCreateChat}
          onOpenSettings={onOpenSettings}
          onRecipientChange={onRecipientChange}
          recipient={recipient}
        />
      </section>
    );
  }

  return (
    <section className="conversation-panel">
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

      <form className="composer" onSubmit={onSendMessage}>
        <button type="button" className="icon-button muted" aria-label="Emoji"><Icon name="smile" /></button>
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Type a message..."
          maxLength="20000"
          disabled={!credentials || isSending}
        />
        <button className="send-button" type="submit" disabled={!draft.trim() || isSending || !credentials} aria-label="Send">
          <Icon name="arrow" size={20} />
        </button>
      </form>
    </section>
  );
}
