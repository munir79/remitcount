/**
 * ✅ Exchange Rate এর হিসাব — Backend এর utils/currencyMath.js এর হুবহু একই সূত্র
 * (Screen এ যা দেখায়, Database এ ঠিক তাই Save হয়) — একটা বদলালে অন্যটাও বদলাতে হবে
 *
 *  - FOREIGN_PER_BASE → "1 MYR = 26.50 BDT"
 *  - BASE_PER_FOREIGN → "1 USD = 4.25 MYR"
 */
export const QUOTE_STYLE = {
  FOREIGN_PER_BASE: "FOREIGN_PER_BASE",
  BASE_PER_FOREIGN: "BASE_PER_FOREIGN",
};

export const QUOTE_STYLE_OPTIONS = [
  { value: QUOTE_STYLE.FOREIGN_PER_BASE, label: "1 MYR = ? foreign", example: "e.g. 1 MYR = 26.50 BDT" },
  { value: QUOTE_STYLE.BASE_PER_FOREIGN, label: "1 foreign = ? MYR", example: "e.g. 1 USD = 4.25 MYR" },
];

const roundTo = (num, decimals) => {
  const n = Number(num);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  return (Math.sign(n) * Math.round(Number((Math.abs(n) * factor).toPrecision(15)))) / factor;
};

const validRate = (rate) => {
  const r = Number(rate);
  return Number.isFinite(r) && r > 0 ? r : null;
};

/** Foreign → MYR (২ দশমিক ঘর); Rate না থাকলে 0 */
export const foreignToBase = (foreignAmount, rate, quoteStyle) => {
  const r = validRate(rate);
  if (!r) return 0;
  const amount = Number(foreignAmount) || 0;
  return roundTo(quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? amount * r : amount / r, 2);
};

/** MYR → Foreign (Currency র দশমিক ঘর অনুযায়ী) */
export const baseToForeign = (baseAmount, rate, quoteStyle, decimals = 2) => {
  const r = validRate(rate);
  if (!r) return 0;
  const amount = Number(baseAmount) || 0;
  return roundTo(quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? amount / r : amount * r, decimals);
};

export const invertRate = (rate) => {
  const r = validRate(rate);
  return r ? roundTo(1 / r, 8) : null;
};

export const isSpreadValid = (buyRate, sellRate, quoteStyle) => {
  if (!buyRate || !sellRate) return true;
  return quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? Number(buyRate) <= Number(sellRate) : Number(buyRate) >= Number(sellRate);
};

const fmt = (n, max = 8) => Number(n).toLocaleString("en-MY", { maximumFractionDigits: max });

/** "1 MYR = 26.50 BDT" — Currency র নিজের Style এ */
export const describeRate = (rate, currency) => {
  if (!validRate(rate) || !currency) return "—";
  // কমপক্ষে ২ দশমিক ঘর (26.50), ছোট Rate এ ৬ পর্যন্ত
  const text = Number(rate).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  return currency.quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? `1 ${currency.code} = ${text} MYR` : `1 MYR = ${text} ${currency.code}`;
};

/**
 * ছোট সংখ্যা যেন 0.00 না হয় — কমপক্ষে ৪ দশমিক ঘর, আর অন্তত ৩টা অর্থপূর্ণ অঙ্ক
 * 0.037736 → "0.0377", 0.00028986 → "0.00029", 0.235294 → "0.2353"
 */
const formatSmall = (n) => {
  const digits = n >= 1 ? 4 : Math.max(4, Math.min(8, -Math.floor(Math.log10(n)) + 2));
  return n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: digits });
};

/**
 * ✅ উল্টো দিক — সবসময় "1" দিয়ে, যাতে সবাই সহজে বোঝেন
 * 1 MYR = 26.50 BDT → "1 BDT = RM 0.0377"
 * 1 USD = 4.25 MYR → "1 MYR = 0.2353 USD"
 */
export const describeInverse = (rate, currency) => {
  const r = validRate(rate);
  if (!r || !currency) return "";
  const text = formatSmall(1 / r);
  return currency.quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? `1 MYR = ${text} ${currency.code}` : `1 ${currency.code} = RM ${text}`;
};

/**
 * ✅ Send এর লাভ — Customer প্রতি RM 1,000 (Fee বাদে) দিলে Rate থেকে কত লাভ
 * 1 MYR = ? style:  Customer দেয় A/send, আমরা দিই A/supplier → লাভ = 1 − send/supplier
 * 1 X = ? MYR style: Customer দেয় A×send, আমরা দিই A×supplier → লাভ = 1 − supplier/send
 * Rate না থাকলে null; ঋণাত্মক মানে ক্ষতি
 */
export const sendMarginFraction = (sendRate, supplierRate, quoteStyle) => {
  const s = validRate(sendRate);
  const p = validRate(supplierRate);
  if (!s || !p) return null;
  return quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? 1 - p / s : 1 - s / p;
};

export const profitPerThousand = (sendRate, supplierRate, quoteStyle) => {
  const m = sendMarginFraction(sendRate, supplierRate, quoteStyle);
  return m === null ? null : roundTo(m * 1000, 2);
};

/** Input এর পাশে Label — "MYR → BDT" দেখাতে */
export const rateUnitLabel = (currency) =>
  !currency ? "" : currency.quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? `MYR per 1 ${currency.code}` : `${currency.code} per 1 MYR`;
