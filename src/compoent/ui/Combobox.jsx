"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";

/**
 * ✅ Search করে বাছাই করার Dropdown — অনেক Customer/Account থাকলে Scroll না করে টাইপ করে খোঁজা যায়
 *
 * options: [{ value, label, sub? }]  — sub = নিচে ছোট লেখা (যেমন Phone, Account Code)
 * onChange(value) — সরাসরি value দেয় (event না)
 *
 * Keyboard: ↑ ↓ দিয়ে বাছাই, Enter দিয়ে Select, Esc দিয়ে বন্ধ
 */
const Combobox = ({
  id,
  label,
  required,
  error,
  hint,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  searchPlaceholder = "Type to search…",
  emptyText = "No results found",
  disabled = false,
  className = "",
  onCreate, // (typedText) => void — দিলে List এর নিচে "+ নতুন তৈরি" Option আসে
  createLabel = (q) => (q ? `Add "${q}" as new` : "Add new"),
}) => {
  const autoId = useId();
  const inputId = id || autoId;
  const listId = `${inputId}-list`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  /**
   * ✅ Dropdown টা Body তে (Portal) Fixed Position এ — Modal এর Scroll করা অংশে কেটে যায় না
   * নিচে জায়গা কম থাকলে উপরের দিকে খোলে; ছোট Screen এ Screen এর ভেতরে থাকে
   */
  const measure = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const spaceBelow = viewportH - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const placeAbove = spaceBelow < 300 && spaceAbove > spaceBelow;
    const room = placeAbove ? spaceAbove : spaceBelow;
    const width = Math.min(Math.max(rect.width, 260), viewportW - 16);
    const left = Math.min(Math.max(8, rect.left), viewportW - width - 8);
    setPosition({
      left,
      width,
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? viewportH - rect.top + 6 : undefined,
      // Search Box ও "নতুন তৈরি" Button এর জায়গা বাদ দিয়ে List এর উচ্চতা
      listMaxHeight: Math.max(120, Math.min(260, room - (onCreate ? 110 : 64))),
      placeAbove,
    });
  };

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.sub || ""}`.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inDropdown) setIsOpen(false);
    };
    // Modal এর ভেতরে Scroll / Window Resize হলে Dropdown Trigger এর সাথে সরে
    const handleReposition = (e) => {
      if (dropdownRef.current?.contains(e.target)) return; // নিজের List Scroll এ না
      measure();
    };
    // ✅ Capture Phase — Modal নিজে mousedown এর stopPropagation করে, তাই Bubble Phase এ এই Listener পৌঁছায় না
    document.addEventListener("mousedown", handleClickOutside, true);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keyboard দিয়ে নড়াচড়া করলে Active Item দেখা যায় এমনভাবে Scroll
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const open = () => {
    if (disabled) return;
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    measure();
    setIsOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const choose = (option) => {
    onChange(option.value);
    setIsOpen(false);
    // Enter-to-next চালু রাখার জন্য Trigger Button এ Focus ফেরত
    requestAnimationFrame(() => document.getElementById(inputId)?.focus());
  };

  const triggerCreate = () => {
    setIsOpen(false);
    onCreate(query.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation(); // Form এর Enter-to-next যেন না চলে
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
      else if (onCreate) triggerCreate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // Modal যেন বন্ধ না হয়
      setIsOpen(false);
      document.getElementById(inputId)?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-describedby={error ? `${inputId}-error` : undefined}
          data-empty={selected ? undefined : "true"}
          onClick={() => (isOpen ? setIsOpen(false) : open())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || (e.key === " " && !isOpen)) {
              e.preventDefault();
              open();
            }
          }}
          className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white pl-3.5 pr-3 text-left text-sm shadow-[0_1px_2px_rgb(16_24_40/0.04)]
            transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-4
            disabled:cursor-not-allowed disabled:bg-slate-50
            ${error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : isOpen
                ? "border-indigo-500 ring-4 ring-indigo-500/15"
                : "border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/15"}`}
        >
          <span className={`truncate ${selected ? "text-slate-900" : "text-slate-400"}`}>
            {selected ? selected.label : placeholder}
            {selected?.sub && <span className="ml-2 text-xs text-slate-400">{selected.sub}</span>}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>

        {isOpen &&
          position &&
          createPortal(
          <div
            ref={dropdownRef}
            style={{ position: "fixed", left: position.left, width: position.width, top: position.top, bottom: position.bottom }}
            className={`z-[100000] flex animate-pop-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elevated ${
              position.placeAbove ? "flex-col-reverse" : "flex-col"
            }`}
          >
            {/* উপরে খুললে Search নিচে (Trigger এর কাছে) থাকে */}
            <div className={`relative shrink-0 border-slate-100 ${position.placeAbove ? "border-t" : "border-b"}`}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-activedescendant={filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <ul ref={listRef} id={listId} role="listbox" style={{ maxHeight: position.listMaxHeight }} className="scrollbar-thin overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 ? (
                <li className={`px-3 text-center text-sm text-slate-500 ${onCreate ? "py-3" : "py-6"}`}>{emptyText}</li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={`${listId}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(option);
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                        isActive ? "bg-indigo-50 text-indigo-900" : "text-slate-700"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.sub && <span className="block truncate text-xs text-slate-500">{option.sub}</span>}
                      </span>
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-indigo-600" />}
                    </li>
                  );
                })
              )}
            </ul>
            {onCreate && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  triggerCreate();
                }}
                className={`flex w-full shrink-0 items-center gap-2 border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-indigo-600 hover:bg-indigo-50 ${
                  position.placeAbove ? "border-b" : "border-t"
                }`}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">{createLabel(query.trim())}</span>
              </button>
            )}
          </div>,
            document.body
          )}
      </div>

      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && (
        <span id={`${inputId}-error`} className="text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
};

export default Combobox;
