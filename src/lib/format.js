/**
 * ✅ সব সংখ্যা/টাকা/তারিখ একই Format এ দেখানোর জন্য
 * Base Currency MYR, Locale en-MY, Timezone Asia/Kuala_Lumpur
 */
export const BASE_CURRENCY = "MYR";
export const CURRENCY_SYMBOL = "RM";
export const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";

/**
 * ✅ Company র Timezone — সব তারিখ / সময় এটা ধরে দেখায় (User এর ফোন / কম্পিউটারের ঘড়ি না)
 * Dashboard Layout Profile থেকে setTimezone() করে; আগের বার এর টা localStorage এ থাকে, তাই প্রথম Render ও ঠিক
 */
const isValidTimezone = (tz) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return Boolean(tz);
  } catch {
    return false;
  }
};
const readStoredTimezone = () => {
  try {
    const stored = localStorage.getItem("timezone");
    return isValidTimezone(stored) ? stored : DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
};
let timezone = typeof window === "undefined" ? DEFAULT_TIMEZONE : readStoredTimezone();

export const getTimezone = () => timezone;

/** নতুন Timezone বসানো — বদলালে true (তখন Screen আবার আঁকতে হয়) */
export const setTimezone = (tz) => {
  if (!isValidTimezone(tz) || tz === timezone) return false;
  timezone = tz;
  try {
    localStorage.setItem("timezone", tz);
  } catch {
    // Storage বন্ধ — শুধু এই Tab এ
  }
  return true;
};

/** Company র আজকের তারিখ — "2026-10-31" (Date Input এর জন্য) */
export const todayInCompany = () => new Date().toLocaleDateString("en-CA", { timeZone: timezone });

/** "Asia/Kuala_Lumpur" → "GMT+8" — এখনকার Offset (Daylight Saving সহ) */
export const timezoneOffsetLabel = (tz = timezone, at = new Date()) => {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
};
const LOCALE = "en-MY";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** 1234.5 → "1,234.50" */
export const formatNumber = (value, decimals = 2) =>
  toNumber(value).toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** 1234.5 → "RM 1,234.50" ; Negative → "-RM 1,234.50" */
export const formatMoney = (value, { symbol = CURRENCY_SYMBOL, decimals = 2 } = {}) => {
  const n = toNumber(value);
  const formatted = formatNumber(Math.abs(n), decimals);
  return `${n < 0 ? "-" : ""}${symbol} ${formatted}`;
};

/** Foreign Amount — "USD 1,000.00" */
export const formatCurrencyAmount = (value, currencyCode, decimals = 2) =>
  `${currencyCode ? `${currencyCode} ` : ""}${formatNumber(value, decimals)}`;

/** Exchange Rate — ছোট মানের Rate (যেমন IDR) এর জন্য বেশি দশমিক ঘর, শেষের অপ্রয়োজনীয় 0 বাদ */
export const formatRate = (value) => {
  const n = toNumber(value);
  return n.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: n !== 0 && Math.abs(n) < 1 ? 8 : 4 });
};

/** "5 min ago" / "3h ago" / "2 days ago" */
export const timeAgo = (value) => {
  if (!value) return "—";
  const mins = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const businessDayKey = (value) => new Date(value).toLocaleDateString("en-CA", { timeZone: timezone });

/** Malaysia র আজকের তারিখে কিনা — "আজকের Rate" যাচাই */
export const isBusinessToday = (value) => Boolean(value) && businessDayKey(value) === businessDayKey(Date.now());

/** "26 Oct 2026" */
export const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: timezone });
};

/** "26 Oct 2026, 3:45 pm" */
export const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  });
};
