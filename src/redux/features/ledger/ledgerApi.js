import { apiSlice } from "@/redux/api/apiSlice";
import { GET_ACCOUNT_LEDGER, GET_TRIAL_BALANCE } from "@/utils/url";


export const ledgerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAccountLedger: builder.query({
      query: ({ accountId, ...params }) => ({ url: GET_ACCOUNT_LEDGER(accountId), method: "GET", params }),
      providesTags: ["Ledger"],
    }),
    getTrialBalance: builder.query({
      // ✅ Fix — আগে params পাঠানো হতো না, তাই Branch Filter কাজ করত না
      query: (params) => ({ url: GET_TRIAL_BALANCE, method: "GET", params }),
      providesTags: ["Ledger"],
    }),
  }),
});

export const { useGetAccountLedgerQuery, useGetTrialBalanceQuery } = ledgerApi;