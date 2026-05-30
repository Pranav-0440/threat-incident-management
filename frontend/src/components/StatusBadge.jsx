export default function StatusBadge({ status }) {
  const st = (status || '').toUpperCase();
  const classMap = {
    OPEN: 'badge-open',
    INVESTIGATING: 'badge-investigating',
    RESOLVED: 'badge-resolved',
  };

  return (
    <span className={`badge ${classMap[st] || 'badge-open'}`}>
      <span className="badge-dot" />
      {st || 'UNKNOWN'}
    </span>
  );
}
