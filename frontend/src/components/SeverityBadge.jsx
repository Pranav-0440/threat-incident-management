export default function SeverityBadge({ severity }) {
  const sev = (severity || '').toUpperCase();
  const classMap = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  };

  return (
    <span className={`badge ${classMap[sev] || 'badge-low'}`}>
      <span className="badge-dot" />
      {sev || 'UNKNOWN'}
    </span>
  );
}
