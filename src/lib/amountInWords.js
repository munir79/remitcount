const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = [
  [1e9, "Billion"],
  [1e6, "Million"],
  [1e3, "Thousand"],
];

const underThousand = (n) => {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
};

const integerToWords = (n) => {
  if (n === 0) return "Zero";
  const parts = [];
  for (const [value, name] of SCALES) {
    if (n >= value) {
      parts.push(`${underThousand(Math.floor(n / value))} ${name}`);
      n %= value;
    }
  }
  if (n > 0) parts.push(underThousand(n));
  return parts.join(" ");
};

/**
 * ✅ Receipt এর জন্য — 2010.5 → "Ringgit Malaysia Two Thousand Ten and Sen Fifty Only"
 */
export const ringgitInWords = (amount) => {
  const total = Math.round(Math.abs(Number(amount) || 0) * 100);
  const ringgit = Math.floor(total / 100);
  const sen = total % 100;
  return `Ringgit Malaysia ${integerToWords(ringgit)}${sen ? ` and Sen ${integerToWords(sen)}` : ""} Only`;
};
