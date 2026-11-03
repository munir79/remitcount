
import { apiSlice } from "@/redux/api/apiSlice";
import {
  CREATE_ACCOUNT,
  GET_ALL_ACCOUNTS,
  GET_ACCOUNT_TREE,
  SUGGEST_NEXT_CODE,
  GET_SINGLE_ACCOUNT,
  UPDATE_ACCOUNT,
  DELETE_ACCOUNT,
} from "@/utils/url";

export const accountApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createAccount: builder.mutation({
      query: (payload) => ({ url: CREATE_ACCOUNT, method: "POST", body: payload }),
      invalidatesTags: ["Account"],
    }),
    getAllAccounts: builder.query({
      query: (params) => ({ url: GET_ALL_ACCOUNTS, method: "GET", params }),
      providesTags: ["Account"],
    }),
    getAccountTree: builder.query({
      query: (params) => ({ url: GET_ACCOUNT_TREE, method: "GET", params }),
      providesTags: ["Account"],
    }),
    // Folder দিলে তার নিচের পরের Code (1100 → 1101), না দিলে Type এর প্রথম খালি Code
    suggestNextCode: builder.query({
      query: (arg) => ({ url: SUGGEST_NEXT_CODE, method: "GET", params: typeof arg === "string" ? { type: arg } : arg }),
      providesTags: ["Account"],
    }),
    getSingleAccount: builder.query({
      query: (id) => ({ url: GET_SINGLE_ACCOUNT(id), method: "GET" }),
      providesTags: ["Account"],
    }),
    updateAccount: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_ACCOUNT(id), method: "PATCH", body: data }),
      invalidatesTags: ["Account", "BankAccount"],
    }),
    deleteAccount: builder.mutation({
      query: (id) => ({ url: DELETE_ACCOUNT(id), method: "DELETE" }),
      invalidatesTags: ["Account"],
    }),
  }),
});

export const {
  useCreateAccountMutation,
  useGetAllAccountsQuery,
  useGetAccountTreeQuery,
  useLazySuggestNextCodeQuery,
  useSuggestNextCodeQuery,
  useGetSingleAccountQuery,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountApi;