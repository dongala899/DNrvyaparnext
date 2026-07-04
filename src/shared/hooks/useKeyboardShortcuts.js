import { useEffect } from 'react';

const SHORTCUTS = [
  { key: 's', ctrl: true, action: 'save', label: 'Ctrl+S — Save' },
  { key: 'n', ctrl: true, action: 'new', label: 'Ctrl+N — New' },
  { key: 'p', ctrl: true, action: 'print', label: 'Ctrl+P — Print' },
  { key: 'f', ctrl: true, action: 'search', label: 'Ctrl+F — Search' },
  { key: 'b', ctrl: true, action: 'back', label: 'Ctrl+B — Back' },
  { key: 'h', ctrl: true, action: 'home', label: 'Ctrl+H — Home' },
];

export function useKeyboardShortcuts(handlers = {}) {
  useEffect(() => {
    const listener = (e) => {
      const shortcut = SHORTCUTS.find(s =>
        s.key === e.key.toLowerCase() && (s.ctrl ? (e.ctrlKey || e.metaKey) : true)
      );
      if (shortcut) {
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          if (shortcut.action === 'save') {
          } else {
            return;
          }
        }
        e.preventDefault();
        const handler = handlers[shortcut.action];
        if (handler) handler();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handlers]);
}

export { SHORTCUTS };
