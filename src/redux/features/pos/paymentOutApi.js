import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_PAYMENT_OUT, GET_ALL_PAYMENT_OUT, GET_SINGLE_PAYMENT_OUT, POST_PAYMENT_OUT } from "@/utils/url";


export const paymentOutApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPaymentOut: builder.mutation({
      query: (payload) => ({ url: CREATE_PAYMENT_OUT, method: "POST", body: payload }),
      invalidatesTags: ["PaymentOut"],
    }),
    getAllPaymentOut: builder.query({
      query: (params) => ({ url: GET_ALL_PAYMENT_OUT, method: "GET", params }),
      providesTags: ["PaymentOut"],
    }),
    getSinglePaymentOut: builder.query({
      query: (id) => ({ url: GET_SINGLE_PAYMENT_OUT(id), method: "GET" }),
      providesTags: ["PaymentOut"],
    }),
    postPaymentOut: builder.mutation({
      query: (id) => ({ url: POST_PAYMENT_OUT(id), method: "PATCH" }),
      invalidatesTags: ["PaymentOut", "BuyCurrency", "Send", "Vendor", "Account", "Report"],
    }),
  }),
});

export const {
  useCreatePaymentOutMutation,
  useGetAllPaymentOutQuery,
  useGetSinglePaymentOutQuery,
  usePostPaymentOutMutation,
} = paymentOutApi;