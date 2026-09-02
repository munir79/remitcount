const POS_INDICATOR_PERMISSIONS = [
  "currencyStock:read",
  "send:read",
  "otherIncome:read",
  "posExpense:read",
  "cashierSession:read",
];

export const getLandingPage = (permissions = []) => {
  const hasAnyPosAccess = POS_INDICATOR_PERMISSIONS.some((key) => permissions.includes(key));
  if (hasAnyPosAccess) return "/pos";

  if (permissions.includes("report:view")) return "/dashboard";

  return "/no-access";
};