import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_PAYMENT_IN, GET_ALL_PAYMENT_IN, GET_SINGLE_PAYMENT_IN, POST_PAYMENT_IN } from "@/utils/url";


export const paymentInApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPaymentIn: builder.mutation({
      query: (payload) => ({ url: CREATE_PAYMENT_IN, method: "POST", body: payload }),
      invalidatesTags: ["PaymentIn"],
    }),
    getAllPaymentIn: builder.query({
      query: (params) => ({ url: GET_ALL_PAYMENT_IN, method: "GET", params }),
      providesTags: ["PaymentIn"],
    }),
    getSinglePaymentIn: builder.query({
      query: (id) => ({ url: GET_SINGLE_PAYMENT_IN(id), method: "GET" }),
      providesTags: ["PaymentIn"],
    }),
    postPaymentIn: builder.mutation({
      query: (id) => ({ url: POST_PAYMENT_IN(id), method: "PATCH" }),
      invalidatesTags: ["PaymentIn", "SellCurrency", "Send", "OtherIncomePos", "Customer", "Account", "Report"],
    }),
  }),
});

export const {
  useCreatePaymentInMutation,
  useGetAllPaymentInQuery,
  useGetSinglePaymentInQuery,
  usePostPaymentInMutation,
} = paymentInApi;