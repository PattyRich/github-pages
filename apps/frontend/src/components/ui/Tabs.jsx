import { useRef } from 'react';
import './Tabs.css';

export default function Tabs({ items, activeKey, onSelect, ariaLabel, idPrefix, className = '' }) {
  const buttonRefs = useRef([]);

  function handleKeyDown(e, index) {
    const keyOffsets = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1,
    };

    let nextIndex = null;
    if (e.key in keyOffsets) {
      nextIndex = (index + keyOffsets[e.key] + items.length) % items.length;
    }
    if (e.key === 'Home') {
      nextIndex = 0;
    }
    if (e.key === 'End') {
      nextIndex = items.length - 1;
    }
    if (nextIndex === null) return;

    e.preventDefault();
    onSelect(items[nextIndex].key);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className={['osrs-tabs', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const isActive = activeKey === item.key;
        return (
          <button
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            key={item.key}
            type="button"
            id={idPrefix ? `${idPrefix}-${item.key}-tab` : undefined}
            className={`osrs-tab ${isActive ? 'is-active' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={idPrefix ? `${idPrefix}-${item.key}-panel` : undefined}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(item.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
