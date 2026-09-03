import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_OTHER_INCOME, CREATE_OTHER_INCOME, GET_ALL_OTHER_INCOMES, GET_SINGLE_OTHER_INCOME, POST_OTHER_INCOME } from "@/utils/url";


export const otherIncomeApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createOtherIncome: builder.mutation({
      query: (payload) => ({ url: CREATE_OTHER_INCOME, method: "POST", body: payload }),
      invalidatesTags: ["OtherIncomePos"],
    }),
    getAllOtherIncomes: builder.query({
      query: (params) => ({ url: GET_ALL_OTHER_INCOMES, method: "GET", params }),
      providesTags: ["OtherIncomePos"],
    }),
    getSingleOtherIncome: builder.query({
      query: (id) => ({ url: GET_SINGLE_OTHER_INCOME(id), method: "GET" }),
      providesTags: ["OtherIncomePos"],
    }),
    postOtherIncome: builder.mutation({
      query: (id) => ({ url: POST_OTHER_INCOME(id), method: "PATCH" }),
      invalidatesTags: ["OtherIncomePos", "Account", "Report"],
    }),
    cancelOtherIncome: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_OTHER_INCOME(id), method: "PATCH", body: { reason } }),
      invalidatesTags: ["OtherIncomePos", "Account", "Report"],
    }),
  }),
});

export const {
  useCreateOtherIncomeMutation,
  useGetAllOtherIncomesQuery,
  useGetSingleOtherIncomeQuery,
  usePostOtherIncomeMutation,
  useCancelOtherIncomeMutation,
} = otherIncomeApi;