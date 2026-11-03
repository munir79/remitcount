import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_CASH_TRANSFER, CREATE_CASH_TRANSFER, GET_ALL_CASH_TRANSFERS, GET_TRANSFER_ACCOUNTS } from "@/utils/url";

// ✅ Drawer ↔ Bank এর মধ্যে টাকা সরানো
export const cashTransferApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCashTransfer: builder.mutation({
      query: (payload) => ({ url: CREATE_CASH_TRANSFER, method: "POST", body: payload }),
      invalidatesTags: ["CashTransfer", "CashierSession", "Account", "BankAccount", "Report"],
    }),
    cancelCashTransfer: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_CASH_TRANSFER(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["CashTransfer", "CashierSession", "Account", "BankAccount", "Report"],
    }),
    getAllCashTransfers: builder.query({
      query: (params) => ({ url: GET_ALL_CASH_TRANSFERS, method: "GET", params }),
      providesTags: ["CashTransfer"],
    }),
    getTransferAccounts: builder.query({
      query: () => ({ url: GET_TRANSFER_ACCOUNTS, method: "GET" }),
      providesTags: ["CashTransfer", "CashierSession", "BankAccount"],
    }),
  }),
});

export const { useCreateCashTransferMutation, useCancelCashTransferMutation, useGetAllCashTransfersQuery, useGetTransferAccountsQuery } = cashTransferApi;
