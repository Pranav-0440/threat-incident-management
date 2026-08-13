/**
 * Fallback copy mechanism using the legacy document.execCommand('copy') API
 * for non-HTTPS/local environments where navigator.clipboard might not be available.
 * @param {string} text 
 * @returns {boolean}
 */
export const fallbackCopyTextToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // Prevent scrolling and keep it invisible
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    document.body.removeChild(textArea);
    return false;
  }
};

/**
 * Copies text to the clipboard, attempting to use the modern navigator.clipboard API first
 * and falling back to a document.execCommand('copy') approach in non-HTTPS/insecure contexts.
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, attempting fallback copy:', err);
    }
  }
  return fallbackCopyTextToClipboard(text);
};
