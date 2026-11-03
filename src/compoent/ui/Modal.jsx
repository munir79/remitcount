"use client";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const subscribeNoop = () => () => {};

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl", "2xl": "max-w-4xl" };

const getPortalRoot = () => {
  if (typeof window === "undefined") return null;

  let root = document.getElementById("global-modal-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "global-modal-root";
    document.body.appendChild(root);
  }
  return root;
};

/**
 * ✅ description — Title এর নিচে ছোট লেখা (Optional)
 * ✅ footer — নিচে আলাদা Bar এ Button রাখার জন্য (Optional)
 * Esc চাপলে বা বাইরে Click করলে বন্ধ হয়
 */
const Modal = ({ isOpen, onClose, title, description, children, footer, size = "md" }) => {
  // Server এ false, Browser এ true — Portal শুধু Browser এ Render হবে
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const portalRoot = getPortalRoot();
  if (!portalRoot) return null;

  return createPortal(
    /**
     * ✅ Responsive Layout
     * - Modal কখনো Screen এর চেয়ে লম্বা হয় না — Header ও Footer (Button) সবসময় দেখা যায়, শুধু মাঝের অংশ Scroll হয়
     * - Mobile এ নিচ থেকে Sheet এর মতো ওঠে (পুরো প্রস্থ), বড় Screen এ মাঝখানে
     * - 100dvh — Mobile Browser এর Address Bar ওঠানামা করলেও সঠিক উচ্চতা
     */
    <div
      className="fixed inset-0 z-[99999] flex animate-fade-in items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`flex max-h-[94dvh] w-full ${SIZES[size] || SIZES.md} animate-pop-in flex-col rounded-t-2xl bg-white shadow-elevated ring-1 ring-slate-900/5 sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet এর হাতল */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-4 pb-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* শুধু এই অংশ Scroll হয় — min-h-0 না দিলে Flex Child নিজের Content এর চেয়ে ছোট হতে পারে না */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-100 px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:rounded-b-2xl sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;
