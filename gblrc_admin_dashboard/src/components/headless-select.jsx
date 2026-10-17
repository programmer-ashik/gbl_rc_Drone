import React, { useEffect, useId, useRef, useState } from 'react';

const ChevronDown = ({ className = '' }) => (
  <svg className={className} viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
    <path
      fillRule='evenodd'
      d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z'
      clipRule='evenodd'
    />
  </svg>
);

const Check = ({ className = '' }) => (
  <svg className={className} viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
    <path
      fillRule='evenodd'
      d='M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z'
      clipRule='evenodd'
    />
  </svg>
);

/**
 * Accessible listbox-style select.
 * options: [{ value, label }]
 */
export const HeadlessSelect = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  disabled = false,
  id,
  'aria-label': ariaLabel,
}) => {
  const autoId = useId();
  const listboxId = id || `headless-select-${autoId}`;
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((option) => String(option.value) === String(value));
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    setActiveIndex(Math.max(selectedIndex, 0));
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const pick = (index) => {
    const option = options[index];
    if (!option) return;
    onChange?.(option.value);
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        pick(activeIndex);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={listboxId}
        type='button'
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={`${listboxId}-menu`}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:border-amber-400 focus-visible:ring-2 focus-visible:ring-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? 'border-amber-400' : 'border-border'
        } ${buttonClassName}`}
      >
        <span className={`min-w-0 truncate ${selected ? 'text-text-primary' : 'text-text-muted'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-warning' : 'text-text-muted'}`}
        />
      </button>

      <ul
        ref={listRef}
        id={`${listboxId}-menu`}
        role='listbox'
        aria-labelledby={listboxId}
        className={`absolute left-0 right-0 z-30 mt-1 max-h-60 origin-top overflow-auto rounded-xl border border-border bg-background-secondary py-1 shadow-lg shadow-black/10 transition duration-150 ease-out ${
          open ? 'visible translate-y-0 scale-y-100 opacity-100' : 'invisible pointer-events-none -translate-y-1 scale-y-95 opacity-0'
        }`}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const isActive = index === activeIndex;
          return (
            <li
              key={`${option.value}`}
              id={`${listboxId}-option-${index}`}
              data-index={index}
              role='option'
              aria-selected={isSelected}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(index)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                isSelected ? 'font-semibold text-warning' : 'text-text'
              } ${isActive ? 'bg-amber-50' : ''}`}
            >
              <span className='min-w-0 truncate'>{option.label}</span>
              {isSelected ? <Check className='h-4 w-4 shrink-0' /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default HeadlessSelect;
