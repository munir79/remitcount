import { apiSlice } from "@/redux/api/apiSlice";
import {
  APPROVE_CASHIER_SESSION,
  CLOSE_CASHIER_SESSION,
  GET_ALL_CASHIER_SESSIONS,
  GET_AVAILABLE_DRAWERS,
  GET_BRANCH_DAY_SUMMARY,
  GET_MY_OPEN_SESSION,
  GET_SESSION_SUMMARY,
  GET_SINGLE_CASHIER_SESSION,
  OPEN_CASHIER_SESSION,
  REJECT_CASHIER_SESSION,
} from "@/utils/url";

export const cashierSessionApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    openCashierSession: builder.mutation({
      query: (payload) => ({ url: OPEN_CASHIER_SESSION, method: "POST", body: payload }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount"],
    }),
    closeCashierSession: builder.mutation({
      query: ({ id, data }) => ({ url: CLOSE_CASHIER_SESSION(id), method: "PATCH", body: data }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "Report"],
    }),
    // Manager — বড় গরমিল মেনে নেওয়া / আবার গুনতে ফেরত পাঠানো
    approveCashierSession: builder.mutation({
      query: ({ id, note }) => ({ url: APPROVE_CASHIER_SESSION(id), method: "PATCH", body: { note } }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "Report"],
    }),
    rejectCashierSession: builder.mutation({
      query: ({ id, note }) => ({ url: REJECT_CASHIER_SESSION(id), method: "PATCH", body: { note } }),
      invalidatesTags: ["CashierSession"],
    }),
    getAllCashierSessions: builder.query({
      query: (params) => ({ url: GET_ALL_CASHIER_SESSIONS, method: "GET", params }),
      providesTags: ["CashierSession"],
    }),
    getMyOpenSession: builder.query({
      query: () => ({ url: GET_MY_OPEN_SESSION, method: "GET" }),
      providesTags: ["CashierSession"],
    }),
    getSingleCashierSession: builder.query({
      query: (id) => ({ url: GET_SINGLE_CASHIER_SESSION(id), method: "GET" }),
      providesTags: ["CashierSession"],
    }),
    // Session এ কী ঢুকল / বের হলো — বন্ধের Report
    getSessionSummary: builder.query({
      query: (id) => ({ url: GET_SESSION_SUMMARY(id), method: "GET" }),
      providesTags: ["CashierSession", "Account"],
    }),
    getAvailableDrawers: builder.query({
      query: () => ({ url: GET_AVAILABLE_DRAWERS, method: "GET" }),
      providesTags: ["CashierSession", "BankAccount"],
    }),
    getBranchDaySummary: builder.query({
      query: (params) => ({ url: GET_BRANCH_DAY_SUMMARY, method: "GET", params }),
      providesTags: ["CashierSession", "BankAccount", "CashTransfer"],
    }),
  }),
});

export const {
  useOpenCashierSessionMutation,
  useCloseCashierSessionMutation,
  useApproveCashierSessionMutation,
  useRejectCashierSessionMutation,
  useGetAllCashierSessionsQuery,
  useGetMyOpenSessionQuery,
  useGetSingleCashierSessionQuery,
  useGetSessionSummaryQuery,
  useGetAvailableDrawersQuery,
  useGetBranchDaySummaryQuery,
} = cashierSessionApi;
