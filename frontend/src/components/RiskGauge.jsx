import { useEffect, useState } from 'react';

export default function RiskGauge({ score = 0, size = 120 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  const getColor = (s) => {
    if (s >= 70) return '#ef4444'; // Critical red
    if (s >= 50) return '#f97316'; // High orange
    if (s >= 30) return '#eab308'; // Medium yellow
    return '#22c55e'; // Low green
  };

  const getLabel = (s) => {
    if (s >= 70) return 'Critical';
    if (s >= 50) return 'High';
    if (s >= 30) return 'Medium';
    return 'Low';
  };

  const color = getColor(score);

  return (
    <div className="risk-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="risk-gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className="risk-gauge-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="risk-gauge-value" style={{ color }}>
        {score}
      </div>
      <div className="risk-gauge-label">{getLabel(score)} Risk</div>
    </div>
  );
}
