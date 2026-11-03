import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = ({ phone, message, label }) => {
  const link = buildWhatsAppLink(phone, message);

  if (!link) {
    return <span className="text-xs text-slate-400">No phone</span>;
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title="Send WhatsApp reminder"
      aria-label="Send WhatsApp reminder"
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-[13px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15 transition hover:bg-emerald-100 ${
        label ? "px-3" : "w-8"
      }`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
};

export default WhatsAppButton;
