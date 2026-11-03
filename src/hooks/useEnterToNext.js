"use client";

const FOCUSABLE = "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])";

/**
 * ✅ POS এ দ্রুত Entry — Enter চাপলে পরের Field এ যায় (Tab এর মতো)
 * শেষ Field এ Enter চাপলে Form Submit হয়
 *
 * <form onKeyDown={handleEnterToNext} …>
 *
 * Textarea তে Enter নতুন লাইন দেয়; Button এ Enter স্বাভাবিক Click করে।
 * Segmented/Toggle Button (role=radio) গুলো বাদ দিয়ে শুধু আসল Field ধরে।
 */
export const handleEnterToNext = (e) => {
  if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

  const target = e.target;
  const tag = target.tagName;
  const isFieldInput = tag === "INPUT" || tag === "SELECT";
  // Combobox Trigger (aria-haspopup) কেও Field হিসেবে ধরা হয়
  const isComboTrigger = tag === "BUTTON" && target.getAttribute("aria-haspopup") === "listbox";
  if (!isFieldInput && !isComboTrigger) return;

  e.preventDefault();

  // খালি Combobox এ Enter = Dropdown খোলা (বাছাই না করে পরের Field এ যাওয়ার মানে নেই)
  if (isComboTrigger && target.dataset.empty === "true") {
    target.click();
    return;
  }

  const form = e.currentTarget;
  const fields = Array.from(form.querySelectorAll(FOCUSABLE)).filter((el) => {
    if (el.getAttribute("role") === "radio" || el.getAttribute("role") === "option") return false;
    if (el.tagName === "BUTTON") return el.getAttribute("aria-haspopup") === "listbox";
    return el.offsetParent !== null; // লুকানো Field বাদ
  });

  const index = fields.indexOf(target);
  const next = fields[index + 1];

  if (next) {
    next.focus();
    if (next.tagName === "INPUT" && typeof next.select === "function") next.select();
  } else {
    form.requestSubmit();
  }
};
