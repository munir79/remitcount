import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_POS_EXPENSE, CREATE_POS_EXPENSE, GET_ALL_POS_EXPENSES, GET_SINGLE_POS_EXPENSE, POST_POS_EXPENSE } from "@/utils/url";


export const posExpenseApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPosExpense: builder.mutation({
      query: (payload) => ({ url: CREATE_POS_EXPENSE, method: "POST", body: payload }),
      invalidatesTags: ["PosExpense"],
    }),
    getAllPosExpenses: builder.query({
      query: (params) => ({ url: GET_ALL_POS_EXPENSES, method: "GET", params }),
      providesTags: ["PosExpense"],
    }),
    getSinglePosExpense: builder.query({
      query: (id) => ({ url: GET_SINGLE_POS_EXPENSE(id), method: "GET" }),
      providesTags: ["PosExpense"],
    }),
    postPosExpense: builder.mutation({
      query: (id) => ({ url: POST_POS_EXPENSE(id), method: "PATCH" }),
      invalidatesTags: ["PosExpense", "Account", "Report"],
    }),
    cancelPosExpense: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_POS_EXPENSE(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["PosExpense", "Account", "Report"],
    }),
  }),
});

export const {
  useCreatePosExpenseMutation,
  useGetAllPosExpensesQuery,
  useGetSinglePosExpenseQuery,
  usePostPosExpenseMutation,
  useCancelPosExpenseMutation,
} = posExpenseApi;