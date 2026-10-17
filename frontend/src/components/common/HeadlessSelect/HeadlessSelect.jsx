import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../Icon/Icon";
import { cn } from "../../../utils/cn";

const menuTransition = {
  type: "spring",
  stiffness: 380,
  damping: 28,
  mass: 0.7,
};

/**
 * Accessible headless select with Framer Motion open/close.
 * options: [{ value, label, count? }]
 */
export const HeadlessSelect = ({
  value = "",
  onChange,
  options = [],
  placeholder = "Select",
  label,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  id,
}) => {
  const autoId = useId();
  const listboxId = id || `headless-select-${autoId}`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => String(option.value) === String(value));
  const display = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <label htmlFor={listboxId} className="mb-1 block text-xs font-semibold text-text-muted">
          {label}
        </label>
      ) : null}
      <button
        id={listboxId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${listboxId}-menu`}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left text-sm text-text outline-none transition-colors focus:border-warning focus:ring-2 focus:ring-warning/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName,
        )}
      >
        <span className={cn("min-w-0 truncate", !selected && "text-text-muted")}>{display}</span>
        <Icon
          name="chevron-down"
          size={4}
          className={cn(
            "shrink-0 cursor-pointer text-text-muted transition-transform duration-200",
            open && "rotate-180 text-warning",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            id={`${listboxId}-menu`}
            role="listbox"
            aria-labelledby={listboxId}
            initial={{ opacity: 0, y: -10, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.98 }}
            transition={menuTransition}
            className={cn(
              "absolute left-0 right-0 z-30 mt-1 max-h-60 origin-top overflow-auto rounded-xl border border-border bg-background py-1 shadow-lg shadow-black/10",
              menuClassName,
            )}
          >
            {options.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <li key={`${option.value}-${option.label}`} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(option.value)}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:outline-none",
                      active
                        ? "bg-warning-bg font-semibold text-warning"
                        : "text-text hover:bg-background-secondary",
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.count != null ? (
                      <span className="shrink-0 text-xs text-text-muted">{option.count}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default HeadlessSelect;
