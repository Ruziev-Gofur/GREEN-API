import Icon from './Icon';
import { DEFAULT_API_URL } from '../utils/chat';

export default function SettingsModal({
  credentialDraft,
  credentials,
  isVerifying,
  onClose,
  onDisconnect,
  onDraftChange,
  onSubmit,
}) {
  const updateDraft = (field, value) => onDraftChange((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="modal-mark"><Icon name="lock" size={20} /></div>
        <h2 id="settings-title">GREEN-API connection</h2>
        <p>Your data is not saved. Enter the API URL and token for this exact instance in the MAX console.</p>
        <form onSubmit={onSubmit}>
          <label>
            API URL
            <input
              value={credentialDraft.apiUrl}
              onChange={(event) => updateDraft('apiUrl', event.target.value)}
              placeholder={DEFAULT_API_URL}
              inputMode="url"
            />
          </label>
          <label>
            idInstance
            <input
              value={credentialDraft.idInstance}
              onChange={(event) => updateDraft('idInstance', event.target.value)}
              placeholder="1101XXXXXXXX"
              autoComplete="off"
            />
          </label>
          <label>
            apiTokenInstance
            <input
              type="password"
              value={credentialDraft.apiTokenInstance}
              onChange={(event) => updateDraft('apiTokenInstance', event.target.value)}
              placeholder="Your API token"
              autoComplete="new-password"
            />
          </label>
          <button className="primary-button full" type="submit" disabled={isVerifying}>
            <Icon name="check" size={18} /> {isVerifying ? 'Checking...' : 'Verify connection'}
          </button>
        </form>
        {credentials && <button className="disconnect-button" type="button" onClick={onDisconnect}>Disconnect</button>}
        <small className="modal-help">Copy the <strong>apiUrl</strong>, <strong>idInstance</strong>, and <strong>apiTokenInstance</strong> values from the same instance in the console.</small>
      </section>
    </div>
  );
}
