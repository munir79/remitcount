import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_BANK_ACCOUNT, DELETE_BANK_ACCOUNT, GET_ALL_BANK_ACCOUNTS, GET_SINGLE_BANK_ACCOUNT, NEW_BANK_ACCOUNT_PREVIEW, UPDATE_BANK_ACCOUNT } from "@/utils/url";

export const bankAccountApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createBankAccount: builder.mutation({
      query: (payload) => ({ url: CREATE_BANK_ACCOUNT, method: "POST", body: payload }),
      invalidatesTags: ["BankAccount"],
    }),
    getAllBankAccounts: builder.query({
      query: (params) => ({ url: GET_ALL_BANK_ACCOUNTS, method: "GET", params }),
      providesTags: ["BankAccount"],
    }),
    // নতুন Account কোন Folder এ কোন Code এ হবে, আর Link করার মতো Account
    getNewBankAccountPreview: builder.query({
      query: (accountType) => ({ url: NEW_BANK_ACCOUNT_PREVIEW, method: "GET", params: { accountType } }),
      providesTags: ["BankAccount", "Account"],
    }),
    getSingleBankAccount: builder.query({
      query: (id) => ({ url: GET_SINGLE_BANK_ACCOUNT(id), method: "GET" }),
      providesTags: ["BankAccount"],
    }),
    updateBankAccount: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_BANK_ACCOUNT(id), method: "PATCH", body: data }),
      invalidatesTags: ["BankAccount"],
    }),
    deleteBankAccount: builder.mutation({
      query: (id) => ({ url: DELETE_BANK_ACCOUNT(id), method: "DELETE" }),
      invalidatesTags: ["BankAccount"],
    }),
  }),
});

export const {
  useCreateBankAccountMutation,
  useGetAllBankAccountsQuery,
  useGetSingleBankAccountQuery,
  useGetNewBankAccountPreviewQuery,
  useUpdateBankAccountMutation,
  useDeleteBankAccountMutation,
} = bankAccountApi;