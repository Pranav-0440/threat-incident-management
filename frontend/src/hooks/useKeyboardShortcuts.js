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
      const isEditing = isEditableElement(event.target);

      // 1. "/" -> Focus global Incident Search bar
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (isEditing) return;

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
          // Short timeout to allow IncidentsPage to mount and render the search input
          setTimeout(focusSearchInput, 60);
        }
        return;
      }

      // 2. "Shift + N" -> Navigate to "Report New Incident" (/incidents/new)
      if (event.shiftKey && (event.key === 'N' || event.key === 'n') && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (isEditing) return;

        event.preventDefault();
        navigate('/incidents/new');
        return;
      }

      // 3. "Escape" -> Close active modal / floating drawer & blur focused input
      if (event.key === 'Escape') {
        if (isEditing && event.target && typeof event.target.blur === 'function') {
          event.target.blur();
        }

        if (typeof onEscape === 'function') {
          onEscape();
        }

        // Dispatch a global event so any active drawer or modal can close
        window.dispatchEvent(new CustomEvent('app:close-drawers'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname, onEscape, enabled]);
}

export default useKeyboardShortcuts;
