import { baseUriBackend } from "@/utils/url";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: baseUriBackend,
  prepareHeaders: (headers) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Profile", "Company", "Branch", "Role", "Permission", "Staff",
    "Account", "Journal", "Ledger", "TrialBalance",
    "BankAccount", "Reconciliation",
    "Customer", "Vendor",
    "Employee", "Payroll",
    "Report", "AuditLog", "Notification",
    "CurrencyStock", "BuyCurrency", "SellCurrency", "Send",
    "OtherIncomePos", "PosExpense", "PaymentIn", "PaymentOut",
    "CashierSession", "ApprovalRequest",
  ],
  // ✅ Note — refetchOnMountOrArgChange রাখছি না ডিফল্টে, কারণ Real-time Refresh এখন 
  // Socket Event এর refetch() দিয়েই হবে (Component নিজে থেকে Control করবে)
  endpoints: () => ({}),
});