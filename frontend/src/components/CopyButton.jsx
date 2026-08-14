import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

export default function CopyButton({
  text,
  ariaLabel = 'Copy to clipboard',
  stopPropagation = false,
  style = {},
  iconSize = 13,
  className = '',
  children
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    
    if (text) {
      const success = await copyTextToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const renderContent = () => {
    if (typeof children === 'function') {
      return children({ copied });
    }
    if (children) {
      return children;
    }
    return <span>{copied ? 'Copied!' : text}</span>;
  };

  const defaultStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 600,
    backgroundColor: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
    color: copied ? '#10b981' : '#94a3b8',
    border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ...style
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : ariaLabel}
      aria-label={ariaLabel}
      type="button"
      style={defaultStyle}
      className={className}
    >
      {copied ? <Check size={iconSize} style={{ color: '#10b981' }} /> : <Copy size={iconSize} />}
      {renderContent()}
    </button>
  );
}
