// "use client";
// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { X } from "lucide-react";

// const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

// const getPortalRoot = () => {
//   if (typeof window === "undefined") return null;

//   let root = document.getElementById("global-modal-root");
//   if (!root) {
//     root = document.createElement("div");
//     root.id = "global-modal-root";
//     document.body.appendChild(root);
//   }
//   return root;
// };

// const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isOpen]);

//   if (!isOpen || !mounted) return null;

//   const portalRoot = getPortalRoot();
//   if (!portalRoot) return null;

//   return createPortal(
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         zIndex: 99999,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "rgba(0,0,0,0.7)",
//         padding: "1rem",
//         overflowY: "auto",
//       }}
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget) onClose();
//       }}
//     >
//       <div
//         className={`my-8 w-full ${SIZES[size]} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl`}
//         onMouseDown={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
//           <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
//           <button
//             type="button"
//             onClick={onClose}
//             className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//         <div className="p-6">{children}</div>
//       </div>
//     </div>,
//     portalRoot
//   );
// };

// export default Modal;

"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const SIZES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" };

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

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const portalRoot = getPortalRoot();
  if (!portalRoot) return null;

  return createPortal(
    // ✅ বাইরের Layer — শুধু Scroll Container, কোনো Flex/Centering না
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0,0,0,0.7)",
        overflowY: "auto",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ✅ ভেতরের Layer — এখানে Flex Centering, min-height দিয়ে সবসময় পুরো Viewport Cover করে,
          তাই Content ছোট হলে Center এ থাকে, বড় হলে Scroll ঠিকভাবে কাজ করে */}
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
        }}
      >
        <div
          className={`w-full ${SIZES[size]} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>,
    portalRoot
  );
};

export default Modal;