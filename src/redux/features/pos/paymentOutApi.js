import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_PAYMENT_OUT, CREATE_PAYMENT_OUT, GET_ALL_PAYMENT_OUT, GET_PAYMENT_OUT_DUES, GET_PAYMENT_OUT_RECEIPT, GET_SINGLE_PAYMENT_OUT, POST_PAYMENT_OUT } from "@/utils/url";

// Payment এর পর বাকি, Balance, Drawer — সব বদলায়
const AFTER_PAYMENT = ["PaymentOut", "BuyCurrency", "Send", "OtherIncomePos", "Customer", "Vendor", "Account", "Report", "CashierSession"];

export const paymentOutApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createPaymentOut: builder.mutation({
      query: (payload) => ({ url: CREATE_PAYMENT_OUT, method: "POST", body: payload }),
      invalidatesTags: AFTER_PAYMENT,
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
      invalidatesTags: AFTER_PAYMENT,
    }),
    cancelPaymentOut: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_PAYMENT_OUT(id), method: "PATCH", body: { reason } }),
      invalidatesTags: AFTER_PAYMENT,
    }),
    // "নাম ধরে" — Supplier / Customer কে যা যা দেওয়ার, পুরনোটা আগে
    getPaymentOutDues: builder.query({
      query: (params) => ({ url: GET_PAYMENT_OUT_DUES, method: "GET", params }),
      providesTags: ["PaymentOut"],
    }),
    getPaymentOutReceipt: builder.query({
      query: (id) => ({ url: GET_PAYMENT_OUT_RECEIPT(id), method: "GET" }),
      providesTags: ["PaymentOut"],
    }),
  }),
});

export const {
  useCreatePaymentOutMutation,
  useGetAllPaymentOutQuery,
  useGetSinglePaymentOutQuery,
  usePostPaymentOutMutation,
  useCancelPaymentOutMutation,
  useGetPaymentOutDuesQuery,
  useGetPaymentOutReceiptQuery,
} = paymentOutApi;
