
const priorityConfig = {
  P1: { label: 'P1 - Critical', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  P2: { label: 'P2 - High', bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: 'rgba(249, 115, 22, 0.3)' },
  P3: { label: 'P3 - Medium', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' },
  P4: { label: 'P4 - Low', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
};

export default function PriorityBadge({ priority = 'P3' }) {
  const config = priorityConfig[priority] || priorityConfig['P3'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
