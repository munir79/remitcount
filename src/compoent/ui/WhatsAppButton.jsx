import { buildWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

const WhatsAppButton = ({ phone, message }) => {
  const link = buildWhatsAppLink(phone, message);

  if (!link) {
    return <span className="text-xs text-slate-300">No phone</span>;
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
      title="Send WhatsApp reminder"
    >
      <MessageCircle className="h-4 w-4" />
    </a>
  );
};

export default WhatsAppButton;