/**
 * ✅ API Data → Combobox Options
 */
export const toAccountOptions = (accounts = []) =>
  accounts.map((a) => ({ value: a._id, label: a.name, sub: a.code }));

// Sub এ Phone ও ID নম্বর — Combobox এ এগুলো দিয়েও খোঁজা যায়
export const toPartyOptions = (parties = []) =>
  parties.map((p) => ({ value: p._id, label: p.name, sub: [p.code, p.phone, p.idNumber].filter(Boolean).join(" · ") || undefined }));

/** একটাই Option থাকলে সেটাই Default — Cashier কে বারবার একই জিনিস বাছতে হয় না */
export const singleOptionDefault = (selected, options = []) => selected || (options.length === 1 ? options[0].value : "");
