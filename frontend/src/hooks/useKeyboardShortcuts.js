import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Checks if the event target is an editable form element
 * (input, textarea, select, or contenteditable).
 */
const isEditableElement = (target) => {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  if (target.isContentEditable || target.getAttribute?.('contenteditable') === 'true') {
    return true;
  }
  return false;
};

/**
 * Helper to handle "/" search shortcut.
 * @returns {boolean} true if shortcut was handled
 */
const handleSearchShortcut = (event, location, navigate) => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (isEditableElement(event.target)) return false;

    event.preventDefault();

    const focusSearchInput = () => {
      const searchInput = document.getElementById('search-input') || document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
        if (searchInput.select) {
          searchInput.select();
        }
      }
    };

    if (location.pathname === '/incidents') {
      focusSearchInput();
    } else {
      navigate('/incidents');
      setTimeout(focusSearchInput, 60);
    }
    return true;
  }
  return false;
};

/**
 * Helper to handle "Shift + N" new incident shortcut.
 * @returns {boolean} true if shortcut was handled
 */
const handleNewIncidentShortcut = (event, navigate) => {
  if (event.shiftKey && (event.key === 'N' || event.key === 'n') && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (isEditableElement(event.target)) return false;

    event.preventDefault();
    navigate('/incidents/new');
    return true;
  }
  return false;
};

/**
 * Helper to handle "Escape" shortcut to close drawers/modals and blur inputs.
 * @returns {boolean} true if shortcut was handled
 */
const handleEscapeShortcut = (event, onEscape) => {
  if (event.key === 'Escape') {
    if (isEditableElement(event.target) && typeof event.target.blur === 'function') {
      event.target.blur();
    }

    if (typeof onEscape === 'function') {
      onEscape();
    }

    window.dispatchEvent(new CustomEvent('app:close-drawers'));
    return true;
  }
  return false;
};

/**
 * Custom hook to register SOC analyst keyboard shortcuts:
 *  - `/`       -> Focus global Incident Search bar
 *  - `Shift+N` -> Navigate to "Report New Incident" page (/incidents/new)
 *  - `Escape`  -> Close active modal / floating drawer
 *
 * @param {Object} options
 * @param {Function} [options.onEscape] - Optional callback when Escape is pressed
 * @param {boolean} [options.enabled=true] - Whether shortcuts are active
 */
export function useKeyboardShortcuts({ onEscape, enabled = true } = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      if (handleSearchShortcut(event, location, navigate)) return;
      if (handleNewIncidentShortcut(event, navigate)) return;
      handleEscapeShortcut(event, onEscape);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location, onEscape, enabled]);
}

export default useKeyboardShortcuts;
