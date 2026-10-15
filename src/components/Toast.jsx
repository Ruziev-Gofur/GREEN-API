import Icon from './Icon';

export default function Toast({ notice }) {
  if (!notice) return null;

  return (
    <div className={`toast ${notice.type}`} role="status">
      <span>{notice.type === 'success' ? <Icon name="check" size={18} /> : <Icon name="close" size={18} />}</span>
      {notice.text}
    </div>
  );
}
