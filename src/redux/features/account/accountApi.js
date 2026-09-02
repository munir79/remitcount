
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
      query: () => ({ url: GET_ACCOUNT_TREE, method: "GET" }),
      providesTags: ["Account"],
    }),
    suggestNextCode: builder.query({
      query: (type) => ({ url: SUGGEST_NEXT_CODE, method: "GET", params: { type } }),
    }),
    getSingleAccount: builder.query({
      query: (id) => ({ url: GET_SINGLE_ACCOUNT(id), method: "GET" }),
      providesTags: ["Account"],
    }),
    updateAccount: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_ACCOUNT(id), method: "PATCH", body: data }),
      invalidatesTags: ["Account"],
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
  useGetSingleAccountQuery,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountApi;