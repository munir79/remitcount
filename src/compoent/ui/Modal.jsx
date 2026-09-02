// "use client";
// import { useEffect } from "react";
// import { X } from "lucide-react";

// const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

// const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//     }
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
//       {/* Clickable Backdrop */}
//       <div 
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
//         onClick={onClose} 
//       />

//       {/* Modal Popup Box */}
//       <div className={`relative z-10 w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}>
//         <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
//           <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
//           <button
//             type="button"
//             onClick={onClose}
//             className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//         <div className="px-6 py-5">{children}</div>
//       </div>
//     </div>
//   );
// };

// export default Modal;

"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const [mounted, setMounted] = useState(false);

  // Ensures code executes strictly on client side after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Don't render anything if closed or during SSR
  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Clickable Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div className={`relative z-10 w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body // Appends directly to body, bypassing parent DOM constraints
  );
};

export default Modal;