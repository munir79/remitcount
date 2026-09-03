import { apiSlice } from "@/redux/api/apiSlice";
import { CLOSE_CASHIER_SESSION, GET_ALL_CASHIER_SESSIONS, GET_MY_OPEN_SESSION, GET_SINGLE_CASHIER_SESSION, OPEN_CASHIER_SESSION } from "@/utils/url";


export const cashierSessionApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    openCashierSession: builder.mutation({
      query: (payload) => ({ url: OPEN_CASHIER_SESSION, method: "POST", body: payload }),
      invalidatesTags: ["CashierSession"],
    }),
    closeCashierSession: builder.mutation({
      query: ({ id, data }) => ({ url: CLOSE_CASHIER_SESSION(id), method: "PATCH", body: data }),
      invalidatesTags: ["CashierSession", "Account", "Report"],
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
  }),
});

export const {
  useOpenCashierSessionMutation,
  useCloseCashierSessionMutation,
  useGetAllCashierSessionsQuery,
  useGetMyOpenSessionQuery,
  useGetSingleCashierSessionQuery,
} = cashierSessionApi;