import Icon from './Icon';
import { avatarLetters, formatTime } from '../utils/chat';

export default function Sidebar({
  activeMessages,
  chat,
  connectionState,
  credentials,
  onCreateChat,
  onOpenSettings,
  onSelectChat,
  onRecipientChange,
  recipient,
  statusText,
}) {
  const lastMessage = activeMessages.at(-1);

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="max-logo" aria-label="MAX">MAX</div>
        <button className="icon-button" onClick={onOpenSettings} aria-label="Settings">
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

      <form className="new-chat" onSubmit={onCreateChat}>
        <label htmlFor="recipient">New chat</label>
        <div className="recipient-input">
          <Icon name="search" size={18} />
          <input
            id="recipient"
            value={recipient}
            onChange={(event) => onRecipientChange(event.target.value)}
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
          <button className="conversation active" onClick={onSelectChat}>
            <span className="avatar">{avatarLetters(chat.label)}</span>
            <span className="conversation-copy">
              <strong>{chat.label}</strong>
              <small>{lastMessage?.text || 'Start typing a message'}</small>
            </span>
            <small className="conversation-time">{lastMessage ? formatTime(lastMessage.createdAt) : ''}</small>
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
  );
}
