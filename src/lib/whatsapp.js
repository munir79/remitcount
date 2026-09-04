/**
 * ✅ WhatsApp Share Link তৈরি করার Utility — কোনো Backend/API লাগে না
 * Phone Number থেকে অপ্রয়োজনীয় Character সরিয়ে, wa.me Link বানায়
 */
export const buildWhatsAppLink = (phone, message) => {
  if (!phone) return null;

  // + এবং Space/Dash সরিয়ে শুধু Digit রাখা (wa.me এর জন্য প্রয়োজন)
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};