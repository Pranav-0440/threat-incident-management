import { useEffect, useState } from 'react';

export default function StatsCard({ label, value, icon: Icon, variant = 'accent' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animated counter
    const target = typeof value === 'number' ? value : 0;
    if (target === 0) {
      const frame = requestAnimationFrame(() => setDisplayValue(0));
      return () => cancelAnimationFrame(frame);
    }

    const duration = 800;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), target);
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(target);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`stat-card ${variant} animate-fade-in`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon">
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{displayValue}</div>
    </div>
  );
}
